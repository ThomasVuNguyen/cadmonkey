"""
K-1B Chat - Modal Deployment (CPU)
Deploy your GGUF model with one command
"""

from pathlib import Path

import modal

app = modal.App("cadmonkey-chat")

# Build image with llama-cpp-python (CUDA wheels) and bake the model into the image
image = (
    modal.Image.from_registry("nvidia/cuda:12.4.1-devel-ubuntu22.04")
    .apt_install(
        "wget",
        "python3",
        "python3-pip",
        "python-is-python3",  # provide /usr/bin/python for pip_install
    )
    # Install FastAPI and llama-cpp-python CUDA wheel (CU124 index)
    .pip_install(
        "fastapi",
        "llama-cpp-python",
        extra_index_url="https://abetlen.github.io/llama-cpp-python/whl/cu124",
    )
    .run_commands(
        "mkdir -p /opt/models",
        "wget -O /opt/models/cadmonkey-1b.gguf https://huggingface.co/ThomasTheMaker/cadmonkey-1b-data-32-gguf/resolve/main/cadmonkey-1b-data-32-q8_0.gguf",
    )
)


# Chat completion endpoint
@app.function(
    image=image,
    gpu="t4",  # NVIDIA T4 GPU
    memory=8192,  # 8GB RAM
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
    import os

    from llama_cpp import Llama

    message = item.get("message", "")
    max_tokens = item.get("max_tokens") or None
    temperature = item.get("temperature", 0.7)

    if not message:
        return {"error": "No message provided"}

    # Lazy-load model for the container
    global _llama_model
    if "_llama_model" not in globals():
        _llama_model = Llama(
            model_path="/opt/models/cadmonkey-1b.gguf",
            n_gpu_layers=-1,  # offload all layers to GPU
            n_ctx=2048,
            verbose=False,
        )

    try:
        result = _llama_model.create_completion(
            prompt=f"User: {message}\nAssistant:",
            max_tokens=max_tokens,
            temperature=temperature,
            stop=["User:"],
        )
        text = result["choices"][0]["text"].strip()
        return {"response": text, "message": message}
    except Exception as e:
        return {"error": str(e)}


# Streaming chat endpoint that forwards raw chunks
@app.function(
    image=image,
    gpu="t4",
    memory=8192,
    timeout=300,
    min_containers=0,
)
@modal.fastapi_endpoint(method="POST")
def chat_stream(item: dict):
    """
    Streaming chat endpoint - Server-Sent Events (raw formatting preserved)

    POST with JSON:
    {
        "message": "Hello!",
        "max_tokens": 256,
        "temperature": 0.7
    }
    """
    import json
    from fastapi.responses import StreamingResponse
    from llama_cpp import Llama

    message = item.get("message", "")
    max_tokens = item.get("max_tokens") or None
    temperature = item.get("temperature", 0.7)

    if not message:
        return {"error": "No message provided"}

    prompt = f"User: {message}\nAssistant:"

    def generate_stream():
        try:
            global _llama_model
            if "_llama_model" not in globals():
                _llama_model = Llama(
                    model_path="/opt/models/cadmonkey-1b.gguf",
                    n_gpu_layers=-1,
                    n_ctx=2048,
                    verbose=False,
                )

            for chunk in _llama_model.create_completion(
                prompt=prompt,
                max_tokens=max_tokens,
                temperature=temperature,
                stop=["User:"],
                stream=True,
            ):
                text = chunk["choices"][0].get("text", "")
                # forward raw chunk (may include newlines/spaces)
                yield f"data: {json.dumps({'token': text})}\n\n"

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
   modal app delete cadmonkey-chat

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
