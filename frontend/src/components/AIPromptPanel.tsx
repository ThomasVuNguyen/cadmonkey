import React, { useState, useContext } from 'react';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { ModelContext } from './contexts';
import { ModelService } from '../services/firestore';
import './AIPromptPanel.css';

interface AIPromptPanelProps {
  className?: string;
  style?: React.CSSProperties;

  variant?: 'default' | 'compact';
  initialPrompt?: string | null;
}

export default function AIPromptPanel({ className, style, variant = 'default', initialPrompt }: AIPromptPanelProps) {
  const model = useContext(ModelContext);
  if (!model) throw new Error('No model');

  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const initialPromptRef = React.useRef(false); // To prevent double firing in React StrictMode

  // Handle initial prompt from landing page
  React.useEffect(() => {
    if (initialPrompt && !initialPromptRef.current && !prompt && !isLoading) {
      initialPromptRef.current = true;
      setPrompt(initialPrompt);
      // We need to set the prompt state first, then trigger generation
      // Using a timeout allows the state update to settle
      setTimeout(() => {
        handleGenerate(initialPrompt);
      }, 100);
    }
  }, [initialPrompt]);

  // Backend URLs (streaming SSE endpoint returns raw formatting)
  const STREAM_URL = 'https://thomas-15--cadmonkey-chat-chat-stream.modal.run';




  const handleGenerate = async (overridePrompt?: string) => {
    const promptToUse = overridePrompt || prompt;
    if (!promptToUse.trim()) return;

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
          message: `hey cadmonkey, make me ${promptToUse}`,
          max_tokens: 4096,
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
                // Append raw token to preserve formatting/newlines
                generatedCode += data.token;
                model.source = generatedCode;
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

      // Final code is the raw streamed text
      const finalCode = generatedCode;
      model.source = finalCode;

      // Auto-save to gallery
      try {
        const modelId = await ModelService.saveModel(promptToUse, finalCode);
        console.log('💾 [SAVE] Model saved successfully! ID:', modelId);
      } catch (saveError) {
        console.error('❌ [SAVE] Failed to save model to gallery:', saveError);
        // Don't show error to user, just log it
      }

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

  if (variant === 'compact') {
    return (
      <div className={`ai-prompt-panel compact ${className ?? ''}`} style={style}>
        <div className="prompt-input-container">
          <InputTextarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="a cube"
            disabled={isLoading}
            onKeyPress={handleKeyPress}
            rows={2}
            className="p-inputtextarea"
          />
        </div>


        <Button
          label={isLoading ? "Making..." : "Make"}
          icon=""
          onClick={() => handleGenerate()}
          disabled={!prompt.trim() || isLoading}
          className={`generate-button ${isLoading ? 'loading' : ''}`}
        />

        {error && (
          <div className="prompt-error">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`ai-prompt-panel default ${className ?? ''}`} style={style}>
      {/* Header */}
      <div className="prompt-header">
        <div className="prompt-icon">
          🤖
        </div>
        <div>
          <h4 className="prompt-title">AI Generator</h4>
        </div>
      </div>

      {/* Input Section */}
      <div className="prompt-input-container">
        <InputTextarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your 3D object..."
          disabled={isLoading}
          onKeyPress={handleKeyPress}
          rows={3}
          className="p-inputtextarea"
        />
      </div>

      {/* Generate Button */}
      <div className="prompt-actions">
        <Button
          label={isLoading ? "Making..." : "Make"}
          icon=""
          onClick={() => handleGenerate()}
          disabled={!prompt.trim() || isLoading}
          className={`generate-button ${isLoading ? 'loading' : ''}`}
        />

      </div>

      {/* Error Message */}
      {error && (
        <div className="prompt-error">
          {error}
        </div>
      )}

    </div>
  );
}
