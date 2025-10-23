import React, { useState, useContext } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { ModelContext } from './contexts';

interface AIPromptPanelProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function AIPromptPanel({ className, style }: AIPromptPanelProps) {
  const model = useContext(ModelContext);
  if (!model) throw new Error('No model');

  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Backend URLs
  const BACKEND_URL = 'https://thomas-15--k-1b-chat-chat.modal.run';
  const STREAM_URL = 'https://thomas-15--k-1b-chat-chat-stream.modal.run';

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // Use streaming endpoint for real-time generation (CPU-only)
      const response = await fetch(STREAM_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `hey cadmonkey, make me ${prompt}`,
          max_tokens: 2000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let generatedCode = '';

      // Clear the editor first
      model.source = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.token) {
                // Clean up the token
                let cleanToken = data.token;
                if (cleanToken.startsWith('Assistant:')) {
                  cleanToken = cleanToken.replace('Assistant:', '').trim();
                }
                if (cleanToken && !cleanToken.startsWith('User:')) {
                  generatedCode += cleanToken + '\n';
                  // Update the editor in real-time
                  model.source = generatedCode;
                }
              }
              
              if (data.done) {
                break;
              }
              
              if (data.error) {
                throw new Error(data.error);
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', parseError);
            }
          }
        }
      }

      // Final cleanup of the generated code
      let finalCode = generatedCode
        .replace(/> EOF by user.*$/gm, '') // Remove "> EOF by user" lines
        .replace(/^>.*$/gm, '') // Remove any lines starting with ">"
        .replace(/\n\s*\n\s*\n/g, '\n\n') // Clean up multiple newlines
        .trim(); // Remove leading/trailing whitespace
      
      // Update with final cleaned code
      model.source = finalCode;
      
      // Clear the prompt
      setPrompt('');
      
    } catch (err) {
      console.error('Error generating OpenSCAD code:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleGenerate();
    }
  };

  return (
    <Card 
      className={`ai-prompt-panel ${className ?? ''}`} 
      style={{
        margin: '10px',
        ...style
      }}
      title="AI CAD Assistant"
    >
      <div className="flex flex-column gap-3">
        <div className="flex flex-row gap-2">
          <InputText
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe what you want to create (e.g., 'a cube', 'a sphere', 'a cylinder with rounded edges')"
            style={{ flex: 1 }}
            disabled={isLoading}
          />
          <Button
            label="Generate"
            icon="pi pi-magic-wand"
            onClick={handleGenerate}
            loading={isLoading}
            disabled={!prompt.trim() || isLoading}
          />
        </div>
        
        {error && (
          <Message 
            severity="error" 
            text={error}
            onClose={() => setError(null)}
          />
        )}
        
        {isLoading && (
          <div className="flex justify-content-center">
            <ProgressSpinner size="30px" />
            <span style={{ marginLeft: '10px' }}>Generating OpenSCAD code...</span>
          </div>
        )}
        
        <div className="text-sm text-600">
          <p><strong>Examples:</strong></p>
          <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
            <li>"a cube"</li>
            <li>"a sphere with radius 5"</li>
            <li>"a cylinder with rounded edges"</li>
            <li>"a torus"</li>
            <li>"a cone"</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}
