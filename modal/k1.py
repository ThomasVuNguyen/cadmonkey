"""
K-1B Chat - Modal Deployment (CPU)
Deploy your GGUF model with one command
"""

import modal

app = modal.App("k-1b-chat")

# Build image with llama.cpp
image = (
    modal.Image.debian_slim()
    .apt_install("git", "build-essential", "cmake", "wget", "libcurl4-openssl-dev")
    .pip_install("fastapi")
    .run_commands(
        "git clone https://github.com/ggerganov/llama.cpp /llama-cpp",
        "cd /llama-cpp && cmake -B build -DCMAKE_BUILD_TYPE=Release -DLLAMA_CURL=OFF && cmake --build build --config Release -j$(nproc)"
    )
)

# Create volume for model storage
volume = modal.Volume.from_name("k-1b-model", create_if_missing=True)

# Upload model (run this once)
@app.local_entrypoint()
def upload_model():
    """
    Upload your GGUF model to Modal

    Usage:
        modal run k1.py::upload_model

    The model file k-1b-q8_0.gguf should be in the model/ directory
    """
    import os

    local_path = "/root/cadmonkey/modal/model/k-1b-q8_0.gguf"
    remote_path = "/k-1b.gguf"

    if not os.path.exists(local_path):
        print(f"✗ Model file not found at {local_path}")
        print("Available files:")
        model_dir = "/root/cadmonkey/modal/model"
        if os.path.exists(model_dir):
            for f in os.listdir(model_dir):
                print(f"  - {f}")
        return

    file_size_gb = os.path.getsize(local_path) / (1024*1024*1024)
    print(f"Uploading model from {local_path}...")
    print(f"Model size: {file_size_gb:.2f} GB")
    print("This may take a few minutes...")

    vol = modal.Volume.from_name("k-1b-model", create_if_missing=True)

    with vol.batch_upload() as batch:
        batch.put_file(local_path, remote_path)

    print(f"✓ Model uploaded successfully to {remote_path}!")

# Chat completion endpoint
@app.function(
    image=image,
    cpu=4.0,  # 4 vCPUs - increased for better performance
    memory=2048,  # 2GB RAM
    volumes={"/models": volume},
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
    import subprocess
    import json

    message = item.get("message", "")
    max_tokens = item.get("max_tokens", 256)
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
                "-m", "/models/k-1b.gguf",
                "-p", prompt,
                "-n", str(max_tokens),
                "--temp", str(temperature),
                "-t", "2",  # Use 2 threads
                "--no-display-prompt",
            ],
            capture_output=True,
            text=True,
            timeout=280,  # 4 minutes 40 seconds (leaving buffer for processing)
        )

        # Parse output
        output = result.stdout.strip()

        # Clean up the response
        if "Assistant:" in output:
            response = output.split("Assistant:")[-1].strip()
        else:
            response = output

        return {
            "response": response,
            "message": message
        }

    except subprocess.TimeoutExpired:
        return {"error": "Request timeout"}
    except Exception as e:
        return {"error": str(e)}

# Health check
@app.function(
    image=image,
    cpu=0.25,
)
@modal.fastapi_endpoint(method="GET")
def health():
    """Health check endpoint"""
    return {"status": "healthy", "model": "k-1b"}

# Local testing function
@app.local_entrypoint()
def test():
    """
    Test the deployment locally
    
    Usage:
        modal run modal_deploy.py
    """
    print("Testing chat endpoint...")
    
    response = chat.remote({
        "message": "What is the capital of France?",
        "max_tokens": 50,
        "temperature": 0.7
    })
    
    print(f"Response: {response}")

"""
=============================================================================
DEPLOYMENT INSTRUCTIONS
=============================================================================

1. Install Modal CLI:
   pip install modal

2. Authenticate:
   modal token new

3. Upload your model (one time):
   modal run modal_deploy.py::upload_model --local-path /path/to/k-1b.gguf

4. Deploy:
   modal deploy modal_deploy.py

5. Get your endpoint URLs:
   After deployment, Modal will show you URLs like:
   - https://your-username--k-1b-chat-chat.modal.run
   - https://your-username--k-1b-chat-chat-stream.modal.run

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
