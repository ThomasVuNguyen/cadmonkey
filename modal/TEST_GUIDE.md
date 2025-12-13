# Cadmonkey Chat Endpoint Testing Guide

## Prerequisites

Before testing, make sure you have:

1. **Uploaded your model** to Modal:
   ```bash
   modal run cadmonkey.py::upload_model --local-path /path/to/your/cadmonkey-1b.gguf
   ```

2. **Python requests library** installed:
   ```bash
   pip install requests
   ```

## Test Script Usage

### 1. Run All Tests

Run the comprehensive test suite:

```bash
python test_endpoints.py
```

This will test:
- ✓ Health check endpoint
- ✓ Standard chat endpoint
- ✓ Streaming chat endpoint
- ✓ Error handling

### 2. Interactive Chat Mode

Start an interactive chat session:

```bash
python test_endpoints.py interactive
```

Type your messages and get responses in real-time. Type `quit` or press Ctrl+C to exit.

## Manual Testing with cURL

### Test Health Endpoint

```bash
curl https://thomas-15--cadmonkey-chat-health-dev.modal.run
```

Expected response:
```json
{
  "status": "healthy",
  "model": "cadmonkey"
}
```

### Test Chat Endpoint

```bash
curl -X POST https://thomas-15--cadmonkey-chat-chat-dev.modal.run \
  -H "Content-Type: application/json" \
  -d '{
    "message": "hey cadmonkey, make me a box",
    "max_tokens": 100,
    "temperature": 0.7
  }'
```

Expected response:
```json
{
  "response": "cube([10, 10, 10]);",
  "message": "hey cadmonkey, make me a box"
}
```

#### More CADMonkey Examples:

```bash
# Create a sphere
curl -X POST https://thomas-15--cadmonkey-chat-chat-dev.modal.run \
  -H "Content-Type: application/json" \
  -d '{"message": "hey cadmonkey, make me a sphere", "max_tokens": 100}'

# Create a cylinder
curl -X POST https://thomas-15--cadmonkey-chat-chat-dev.modal.run \
  -H "Content-Type: application/json" \
  -d '{"message": "hey cadmonkey, make me a cylinder", "max_tokens": 100}'

# Create a cone
curl -X POST https://thomas-15--cadmonkey-chat-chat-dev.modal.run \
  -H "Content-Type: application/json" \
  -d '{"message": "hey cadmonkey, make me a cone", "max_tokens": 100}'

# Create a torus
curl -X POST https://thomas-15--cadmonkey-chat-chat-dev.modal.run \
  -H "Content-Type: application/json" \
  -d '{"message": "hey cadmonkey, make me a torus", "max_tokens": 100}'
```

## Testing from JavaScript/Browser

### Standard Chat Request

```javascript
async function generateCAD(prompt) {
  const response = await fetch('https://thomas-15--cadmonkey-chat-chat-dev.modal.run', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: prompt,
      max_tokens: 200,
      temperature: 0.7
    })
  });

  const data = await response.json();
  console.log('OpenSCAD Code:', data.response);
  return data;
}

// Usage Examples
generateCAD('hey cadmonkey, make me a box');
generateCAD('hey cadmonkey, make me a sphere');
generateCAD('hey cadmonkey, make me a cylinder');
generateCAD('hey cadmonkey, make me a cone');
generateCAD('hey cadmonkey, make me a torus');
```

## API Parameters

### Chat Endpoint Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `message` | string | Yes | - | The user's message/prompt |
| `max_tokens` | integer | No | 256 | Maximum tokens to generate |
| `temperature` | float | No | 0.7 | Sampling temperature (0.0-2.0) |

### Response Format

**Success Response:**
```json
{
  "response": "Generated text from the model",
  "message": "Original user message"
}
```

**Error Response:**
```json
{
  "error": "Error description"
}
```

## Troubleshooting

### Common Issues

1. **Connection Timeout**
   - The model might be cold-starting (first request after idle)
   - Wait 30-60 seconds and try again
   - Check if the model was uploaded: `modal volume ls cadmonkey-model`

2. **404 Not Found**
   - Verify the endpoint URLs match your deployment
   - Check deployment status: `modal app list`

3. **500 Internal Server Error**
   - Check if model file exists: `/models/cadmonkey-1b.gguf`
   - View logs: `modal app logs cadmonkey-chat`

4. **Empty Response**
   - Increase `max_tokens` parameter
   - Try a different prompt
   - Check model compatibility with llama.cpp

### View Logs

```bash
# View real-time logs
modal app logs cadmonkey-chat --follow

# View recent logs
modal app logs cadmonkey-chat
```

### Check Deployment Status

```bash
# List apps
modal app list

# Check specific app
modal app show cadmonkey-chat
```

## Performance Tips

1. **Cold Start**: First request may take 30-60 seconds
2. **Keep Warm**: Set `min_containers=1` in cadmonkey.py to keep container ready (costs more)
3. **Token Limit**: Lower `max_tokens` for faster responses
4. **Temperature**: Lower temperature (0.1-0.5) for more deterministic outputs

## Cost Monitoring

Check usage and costs:
```bash
modal profile usage
```

View detailed metrics:
- Visit: https://modal.com/thomas-15/main/deployed/cadmonkey-chat
- Click on "Metrics" tab

## Next Steps

- Add authentication to protect endpoints
- Implement rate limiting
- Add conversation history/context
- Monitor usage and costs
- Scale up resources if needed (increase CPU/memory)
