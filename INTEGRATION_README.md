# CADMonkey Integration

This project integrates the Modal backend with the Firebase frontend to create an AI-powered OpenSCAD playground.

## Architecture

- **Backend**: Modal deployment with K-1B model for generating OpenSCAD code
- **Frontend**: React-based OpenSCAD playground with AI prompt integration

## Features

✅ **AI Text-to-OpenSCAD**: Users can describe objects in natural language and get OpenSCAD code
✅ **Real-time Rendering**: Generated code is automatically rendered in the 3D viewer
✅ **Interactive Editor**: Users can modify the generated code manually
✅ **Multiple Shapes**: Supports cubes, spheres, cylinders, cones, torus, and more

## How It Works

1. **User Input**: User types a description like "a cube" or "a sphere with radius 5"
2. **Backend Processing**: The Modal backend processes the prompt and generates OpenSCAD code
3. **Code Integration**: The generated code is inserted into the editor
4. **Automatic Rendering**: The 3D model is rendered automatically in the viewer

## Backend Details

- **URL**: `https://thomas-15--k-1b-chat-chat.modal.run`
- **Model**: K-1B (1 billion parameter model)
- **API**: REST endpoint accepting JSON with message, max_tokens, and temperature
- **Response**: Returns OpenSCAD code in the `response` field

## Frontend Integration

The integration adds an AI Prompt Panel to the existing OpenSCAD playground:

- **Location**: Top of the interface, above the editor/viewer panels
- **Components**: Input field, generate button, loading indicator, error handling
- **Styling**: Uses PrimeReact components for consistent UI

## Usage

1. **Start the Frontend**:
   ```bash
   cd firebase
   npm install
   npm run build:libs
   npm start
   ```

2. **Access the Application**: Open http://localhost:4000

3. **Use AI Assistant**:
   - Enter a description in the AI prompt field
   - Click "Generate" or press Enter
   - Watch the OpenSCAD code appear in the editor
   - See the 3D model render in the viewer

## Example Prompts

- "a cube"
- "a sphere with radius 5"
- "a cylinder with rounded edges"
- "a torus"
- "a cone"
- "a cube with rounded edges"

## Files Modified

- `firebase/src/components/AIPromptPanel.tsx` - New AI prompt component
- `firebase/src/components/App.tsx` - Integrated AI panel into main layout

## Testing

A test page is available at `/root/cadmonkey/test_integration.html` that:
- Tests backend connectivity
- Provides integration instructions
- Shows expected behavior

## Backend Testing

The backend can be tested directly:

```bash
curl -X POST https://thomas-15--k-1b-chat-chat.modal.run \
  -H "Content-Type: application/json" \
  -d '{"message": "hey cadmonkey, make me a cube", "max_tokens": 100, "temperature": 0.7}'
```

Expected response:
```json
{
  "response": "cube(size = 10);\n\n> EOF by user",
  "message": "hey cadmonkey, make me a cube"
}
```

## Development Notes

- The backend URL is hardcoded in the AIPromptPanel component
- Error handling includes network errors and API errors
- Loading states provide user feedback during generation
- The integration preserves all existing OpenSCAD playground functionality

## Next Steps

- Add authentication to the backend
- Implement rate limiting
- Add conversation history
- Support for more complex shapes and operations
- Batch processing for multiple objects
