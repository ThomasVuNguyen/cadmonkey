import React, { useState, useContext } from 'react';
import { InputTextarea } from 'primereact/inputtextarea';
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
  const [isGenerating, setIsGenerating] = useState(false);

  // Backend URLs
  const BACKEND_URL = 'https://thomas-15--k-1b-chat-chat.modal.run';
  const STREAM_URL = 'https://thomas-15--k-1b-chat-chat-stream.modal.run';

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setIsGenerating(true);
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
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleGenerate();
    }
  };

  return (
    <div className={`ai-prompt-panel ${className ?? ''}`} style={style}>
      <Card className="ai-prompt-card" style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        border: 'none',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        margin: '0',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '24px' }}>
          {/* Header */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '20px',
            color: 'white'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '12px',
              fontSize: '18px'
            }}>
              🤖
            </div>
            <div>
              <h3 style={{ margin: '0', fontSize: '18px', fontWeight: '600' }}>
                AI OpenSCAD Generator
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: '0.8' }}>
                Describe your 3D object and watch it come to life
              </p>
            </div>
          </div>

          {/* Input Section */}
          <div style={{ marginBottom: '16px' }}>
            <InputTextarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your 3D object... (e.g., 'a cube', 'a sphere with radius 5', 'a complex geometric shape')"
              disabled={isLoading}
              onKeyPress={handleKeyPress}
              rows={3}
              style={{
                width: '100%',
                borderRadius: '12px',
                border: '2px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: '16px',
                padding: '16px',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease'
              }}
              className="ai-prompt-input"
            />
          </div>

          {/* Generate Button */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Button
              label={isLoading ? "Generating..." : "Generate OpenSCAD"}
              icon={isLoading ? "pi pi-spin pi-spinner" : "pi pi-magic-wand"}
              onClick={handleGenerate}
              disabled={!prompt.trim() || isLoading}
              className="p-button-primary"
              style={{
                flex: 1,
                height: '48px',
                borderRadius: '12px',
                background: isLoading ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.9)',
                color: isLoading ? 'white' : '#667eea',
                border: 'none',
                fontSize: '16px',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
              }}
            />
            
            {/* Generation Status */}
            {isGenerating && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                color: 'white',
                fontSize: '14px',
                opacity: '0.8'
              }}>
                <ProgressSpinner 
                  style={{ width: '20px', height: '20px', marginRight: '8px' }}
                  strokeWidth="3"
                />
                <span>Streaming...</span>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div style={{ marginTop: '16px' }}>
              <Message 
                severity="error" 
                text={error}
                style={{
                  borderRadius: '12px',
                  background: 'rgba(255,87,87,0.1)',
                  border: '1px solid rgba(255,87,87,0.3)',
                  color: '#ff5757'
                }}
              />
            </div>
          )}

          {/* Tips */}
          {!isLoading && !prompt && (
            <div style={{ 
              marginTop: '16px', 
              color: 'rgba(255,255,255,0.7)',
              fontSize: '14px',
              lineHeight: '1.5'
            }}>
              <strong>💡 Tips:</strong> Be specific about dimensions, shapes, and features. 
              Try prompts like "a cube with rounded corners" or "a complex gear mechanism".
            </div>
          )}
        </div>
      </Card>

      {/* Custom Styles */}
      <style jsx>{`
        .ai-prompt-input::placeholder {
          color: rgba(255,255,255,0.6);
        }
        
        .ai-prompt-input:focus {
          border-color: rgba(255,255,255,0.5) !important;
          box-shadow: 0 0 0 3px rgba(255,255,255,0.1) !important;
          background: rgba(255,255,255,0.15) !important;
        }
        
        .ai-prompt-card {
          transition: all 0.3s ease;
        }
        
        .ai-prompt-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.15);
        }
      `}</style>
    </div>
  );
}
