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
    <div className={`ai-prompt-panel ${className ?? ''}`} style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      padding: '16px',
      ...style
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: '12px',
        color: '#495057'
      }}>
        <div style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: '8px',
          fontSize: '12px'
        }}>
          🤖
        </div>
        <div>
          <h4 style={{ margin: '0', fontSize: '14px', fontWeight: '600' }}>
            AI Generator
          </h4>
        </div>
      </div>

      {/* Input Section */}
      <div style={{ marginBottom: '12px', flex: 1 }}>
        <InputTextarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your 3D object..."
          disabled={isLoading}
          onKeyPress={handleKeyPress}
          rows={2}
          style={{
            width: '100%',
            borderRadius: '8px',
            border: '1px solid #e1e5e9',
            background: '#f8f9fa',
            color: '#495057',
            fontSize: '14px',
            padding: '12px',
            resize: 'none',
            transition: 'all 0.2s ease'
          }}
          className="ai-prompt-input"
        />
      </div>

      {/* Generate Button */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <Button
          label={isLoading ? "Generating..." : "Generate"}
          icon={isLoading ? "pi pi-spin pi-spinner" : "pi pi-magic-wand"}
          onClick={handleGenerate}
          disabled={!prompt.trim() || isLoading}
          className="p-button-primary"
          style={{
            flex: 1,
            height: '36px',
            borderRadius: '8px',
            background: isLoading ? '#6c757d' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }}
        />
        
        {/* Generation Status */}
        {isGenerating && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            color: '#6c757d',
            fontSize: '12px'
          }}>
            <ProgressSpinner 
              style={{ width: '16px', height: '16px', marginRight: '6px' }}
              strokeWidth="3"
            />
            <span>Streaming...</span>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div style={{ marginTop: '8px' }}>
          <Message 
            severity="error" 
            text={error}
            style={{
              borderRadius: '8px',
              background: '#f8d7da',
              border: '1px solid #f5c6cb',
              color: '#721c24',
              fontSize: '12px'
            }}
          />
        </div>
      )}

      {/* Custom Styles */}
      <style jsx>{`
        .ai-prompt-input::placeholder {
          color: #adb5bd;
        }
        
        .ai-prompt-input:focus {
          border-color: #667eea !important;
          box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1) !important;
          background: white !important;
        }
      `}</style>
    </div>
  );
}
