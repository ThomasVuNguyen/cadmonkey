"""
K-1B Chat - Modal Deployment (CPU)
Deploy your GGUF model with one command
"""

from pathlib import Path

import modal

app = modal.App("cadmonkey-chat")

# Build image with llama.cpp and bake the model into the image
image = (
    modal.Image.debian_slim()
    .apt_install("git", "build-essential", "cmake", "wget", "libcurl4-openssl-dev")
    .pip_install("fastapi")
    .run_commands(
        "git clone https://github.com/ggerganov/llama.cpp /llama-cpp",
        "cd /llama-cpp && cmake -B build -DCMAKE_BUILD_TYPE=Release -DLLAMA_CURL=OFF && cmake --build build --config Release -j$(nproc)",
        "mkdir -p /opt/models",
        "wget -O /opt/models/cadmonkey-1b.gguf https://huggingface.co/ThomasTheMaker/cadmonkey-1b-data-32-gguf/resolve/main/cadmonkey-1b-data-32-q8_0.gguf",
    )
)


# Chat completion endpoint
@app.function(
    image=image,
    cpu=8.0,  # 8 vCPUs - back to CPU since GPU setup is complex
    memory=4096,  # 4GB RAM - increased for better performance
    timeout=300,  # 5 minutes timeout
    min_containers=0,  # Scale to zero when idle (saves money)
)
@modal.fastapi_endpoint(method="POST")
def chat(item: dict):
    """
    Chat endpoint - OpenAI compatible

    POST with JSON:
    {
        "message": "Hello!",
        "max_tokens": 256,
        "temperature": 0.7
    }
    """
    import json
    import subprocess

    message = item.get("message", "")
    max_tokens = item.get("max_tokens") or 512
    temperature = item.get("temperature", 0.7)

    if not message:
        return {"error": "No message provided"}

    # Build prompt
    prompt = f"User: {message}\nAssistant:"

    # Run llama.cpp
    try:
        result = subprocess.run(
            [
                "/llama-cpp/build/bin/llama-cli",
                "-m",
                "/opt/models/cadmonkey-1b.gguf",
                "-p",
                prompt,
                "-n",
                str(max_tokens),
                "--temp",
                str(temperature),
                "--no-display-prompt",
                "--simple-io",
                "--single-turn",
            ],
            capture_output=True,
            stdin=subprocess.DEVNULL,  # Match `</dev/null` to avoid interactive waits
            text=True,
            timeout=280,  # 4 minutes 40 seconds (leaving buffer for processing)
        )

        # Parse output
        raw_output = result.stdout.strip()

        # Drop llama.cpp diagnostics (memory tables, exit notices)
        filtered_lines = []
        for line in raw_output.splitlines():
            if "llama_memory_breakdown_print" in line:
                continue
            if "unaccounted" in line and "memory" in line:
                continue
            if "Exiting" in line:
                continue
            filtered_lines.append(line)
        output = "\n".join(filtered_lines).strip()

        # Clean up the response
        if "Assistant:" in output:
            response = output.split("Assistant:")[-1].strip()
        else:
            response = output

        return {"response": response, "message": message}

    except subprocess.TimeoutExpired:
        return {"error": "Request timeout"}
    except Exception as e:
        return {"error": str(e)}


# Streaming chat endpoint (CPU-only)
@app.function(
    image=image,
    cpu=8.0,  # 8 vCPUs - CPU-only configuration
    memory=4096,  # 4GB RAM
    timeout=300,  # 5 minutes timeout
    min_containers=0,  # Scale to zero when idle (saves money)
)
@modal.fastapi_endpoint(method="POST")
def chat_stream(item: dict):
    """
    Streaming chat endpoint - returns Server-Sent Events (CPU-only)

    POST with JSON:
    {
        "message": "Hello!",
        "max_tokens": 256,
        "temperature": 0.7
    }
    """
    import json
    import os
    import select
    import subprocess
    import time

    from fastapi.responses import StreamingResponse

    message = item.get("message", "")
    max_tokens = item.get("max_tokens") or 512
    temperature = item.get("temperature", 0.7)

    if not message:
        return {"error": "No message provided"}

    # Build prompt
    prompt = f"User: {message}\nAssistant:"

    def generate_stream():
        try:
            # Run llama.cpp with streaming output (CPU-only)
            process = subprocess.Popen(
                [
                    "/llama-cpp/build/bin/llama-cli",
                    "-m",
                    "/opt/models/cadmonkey-1b.gguf",
                    "-p",
                    prompt,
                    "-n",
                    str(max_tokens),
                    "--temp",
                    str(temperature),
                    "--no-display-prompt",
                    "--simple-io",
                    "--single-turn",
                ],
                stdout=subprocess.PIPE,
                stdin=subprocess.DEVNULL,  # No stdin so the process can't wait for input
                stderr=subprocess.STDOUT,  # Merge stderr so it can't block the pipe
                text=False,  # Binary to allow non-blocking read
                bufsize=0,  # Unbuffered
            )

            # Read small chunks to avoid waiting for newlines, with idle timeout
            buffer = ""
            token_count = 0
            start_time = time.time()
            last_data_time = time.time()
            idle_timeout = 5  # seconds without tokens before we bail
            wall_timeout = 120  # hard cap to prevent runaway

            while True:
                # Hard wall timeout
                if time.time() - start_time > wall_timeout:
                    process.kill()
                    yield f"data: {json.dumps({'error': 'Generation exceeded wall timeout'})}\n\n"
                    return

                ready, _, _ = select.select([process.stdout], [], [], 1.0)

                if ready:
                    reader = getattr(process.stdout, "read1", None)
                    if reader is not None:
                        raw = reader(1024)
                    else:
                        raw = os.read(process.stdout.fileno(), 1024)
                    if raw == b"":
                        break  # EOF
                    last_data_time = time.time()
                    chunk = raw.decode("utf-8", errors="ignore")
                    buffer += chunk
                    while "\n" in buffer:
                        line, buffer = buffer.split("\n", 1)
                        if not line.strip():
                            continue
                        cleaned_line = line.strip()
                        if cleaned_line.startswith("Assistant:"):
                            cleaned_line = cleaned_line.replace(
                                "Assistant:", ""
                            ).strip()
                        if "llama_memory_breakdown_print" in cleaned_line:
                            continue
                        if "Exiting" in cleaned_line:
                            continue
                        if cleaned_line and not cleaned_line.startswith("User:"):
                            yield f"data: {json.dumps({'token': cleaned_line})}\n\n"
                            token_count += 1
                            if token_count >= max_tokens:
                                process.kill()
                                yield f"data: {json.dumps({'done': True})}\n\n"
                                return
                else:
                    # No data this tick; check for exit or idle stall
                    if process.poll() is not None:
                        break
                    if time.time() - last_data_time > idle_timeout:
                        process.kill()
                        yield f"data: {json.dumps({'error': 'Generation stalled (idle timeout)'})}\n\n"
                        return

            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
                yield f"data: {json.dumps({'error': 'Generation process hung and was terminated'})}\n\n"
                return

            # Flush any trailing buffer content after process exit
            if buffer.strip():
                cleaned_line = buffer.strip()
                if cleaned_line.startswith("Assistant:"):
                    cleaned_line = cleaned_line.replace("Assistant:", "").strip()
                if cleaned_line and not cleaned_line.startswith("User:"):
                    yield f"data: {json.dumps({'token': cleaned_line})}\n\n"

            yield f"data: {json.dumps({'done': True})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )


# Health check
@app.function(
    image=image,
    cpu=0.25,
)
@modal.fastapi_endpoint(method="GET")
def health():
    """Health check endpoint"""
    return {"status": "healthy", "model": "cadmonkey-1b"}


# Local testing function
@app.local_entrypoint()
def test():
    """
    Test the deployment locally

    Usage:
        modal run modal_deploy.py
    """
    print("Testing chat endpoint...")

    response = chat.remote(
        {
            "message": "What is the capital of France?",
            "max_tokens": 50,
            "temperature": 0.7,
        }
    )

    print(f"Response: {response}")


"""
=============================================================================
DEPLOYMENT INSTRUCTIONS
=============================================================================

1. Install Modal CLI:
   pip install modal

2. Authenticate:
   modal setup

3. Model is baked into the image at build time (no separate upload step).

4. Deploy:
   modal deploy cadmonkey.py

5. Get your endpoint URLs:
   After deployment, Modal will show you URLs like:
   - https://your-username--cadmonkey-chat.modal.run/chat
   - https://your-username--cadmonkey-chat.modal.run/chat_stream

6. Test it:
   curl -X POST https://your-url/chat \
     -H "Content-Type: application/json" \
     -d '{"message": "Hello!", "max_tokens": 100}'

=============================================================================
COST
=============================================================================

CPU pricing: ~$0.18/hour when running
- Scales to ZERO when idle (you pay nothing!)
- Only charged when actually processing requests
- With light usage: ~$1-5/month

=============================================================================
USAGE FROM BROWSER
=============================================================================

const response = await fetch('https://your-url/chat', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
        message: 'Hello!',
        max_tokens: 100,
        temperature: 0.7
    })
});

const data = await response.json();
console.log(data.response);

=============================================================================
"""
