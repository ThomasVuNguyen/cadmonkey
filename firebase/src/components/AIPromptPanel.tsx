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
}

export default function AIPromptPanel({ className, style, variant = 'default' }: AIPromptPanelProps) {
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
      
      // Generate thumbnail for the cleaned code
      console.log('🎨 [THUMBNAIL] Starting thumbnail generation...');
      const thumbnail = await generateThumbnail(finalCode);
      console.log('🎨 [THUMBNAIL] Thumbnail generated!');
      console.log('🎨 [THUMBNAIL] Type:', typeof thumbnail);
      console.log('🎨 [THUMBNAIL] Length:', thumbnail ? thumbnail.length : 'null');
      console.log('🎨 [THUMBNAIL] Starts with:', thumbnail ? thumbnail.substring(0, 50) : 'null');

      // Auto-save to gallery with thumbnail
      try {
        console.log('💾 [SAVE] Calling ModelService.saveModel with thumbnail...');
        const modelId = await ModelService.saveModel(prompt, finalCode, thumbnail);
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

  // Generate a REAL 3D rendered thumbnail for the OpenSCAD code
  const generateThumbnail = async (scadCode: string): Promise<string> => {
    try {
      console.log('🔧 [RENDER] Generating actual 3D thumbnail...');

      // Import the spawnOpenSCAD function to render the actual code
      const { spawnOpenSCAD } = await import('../runner/openscad-runner');

      // Use spawnOpenSCAD to render the OpenSCAD code to STL
      const job = spawnOpenSCAD({
        mountArchives: true,
        inputs: [{
          path: '/thumbnail.scad',
          content: scadCode
        }],
        args: [
          '/thumbnail.scad',
          '-o', 'thumbnail.off',
          '--backend=manifold',
          '--export-format=off',
          '--enable=lazy-union'
        ],
        outputPaths: ['thumbnail.off']
      }, (streams) => {
        console.log('Thumbnail OpenSCAD output:', streams);
      });

      // Wait for the rendering to complete
      const result = await job;

      if (result.error) {
        console.error('❌ [RENDER] Thumbnail OpenSCAD rendering error:', result.error);
        console.log('⚠️ [RENDER] Using fallback icon instead');
        return generateFallbackIcon(scadCode);
      }

      if (result.outputs && result.outputs.length > 0) {
        const [, content] = result.outputs[0];
        console.log('✅ [RENDER] Thumbnail OpenSCAD rendering successful!');
        console.log('🔄 [CONVERT] Converting OFF to GLB format...');

        // Convert OFF to GLB (same as main viewer does)
        const { parseOff } = await import('../io/import_off');
        const { exportGlb } = await import('../io/export_glb');

        const offText = new TextDecoder().decode(content);
        const offData = parseOff(offText);
        const glbBlob = await exportGlb(offData);

        console.log('✅ [CONVERT] Conversion to GLB successful!');
        console.log('📸 [CAPTURE] Capturing 3D model screenshot...');

        // Create a temporary model-viewer element to display the 3D model
        // IMPORTANT: Must be visible and in viewport for rendering to work
        const modelViewer = document.createElement('model-viewer') as any;
        modelViewer.src = URL.createObjectURL(glbBlob);

        // Style - must be VISIBLE for WebGL to render!
        modelViewer.style.width = '600px';
        modelViewer.style.height = '600px';
        modelViewer.style.position = 'fixed';
        modelViewer.style.top = '50%';
        modelViewer.style.left = '50%';
        modelViewer.style.transform = 'translate(-50%, -50%)';
        modelViewer.style.zIndex = '9999';
        modelViewer.style.backgroundColor = '#f0f0f0';
        modelViewer.style.border = '2px solid #667eea';

        // Model viewer attributes (same as main viewer for consistency)
        modelViewer.setAttribute('camera-controls', '');
        modelViewer.setAttribute('orientation', '0deg -90deg 0deg');
        modelViewer.setAttribute('camera-orbit', '0.7854rad 0.7854rad auto');
        modelViewer.setAttribute('environment-image', './skybox-lights.jpg');

        console.log('📺 [CAPTURE] Adding model-viewer to DOM (visible for WebGL rendering)');

        // Add to DOM temporarily
        document.body.appendChild(modelViewer);

        // Wait for model to load and render properly
        await new Promise((resolve) => {
          let loadFired = false;
          modelViewer.addEventListener('load', () => {
            console.log('✅ [CAPTURE] Model loaded event fired');
            loadFired = true;
            // Give WebGL extra time to render frames
            setTimeout(resolve, 2000);
          });
          // Fallback timeout in case load never fires
          setTimeout(() => {
            if (!loadFired) {
              console.warn('⚠️ [CAPTURE] Load event never fired, using fallback timeout');
            }
            resolve(null);
          }, 8000);
        });

        // Capture screenshot using toDataURL
        try {
          const dataUrl = await modelViewer.toDataURL('image/png', 0.9);

          // Clean up
          document.body.removeChild(modelViewer);
          URL.revokeObjectURL(modelViewer.src);

          if (dataUrl) {
            console.log('✅ [CAPTURE] Successfully captured actual 3D thumbnail!');
            console.log('📊 [CAPTURE] Data URL length:', dataUrl.length);
            return dataUrl;
          } else {
            console.error('❌ [CAPTURE] dataUrl is empty!');
          }
        } catch (screenshotErr) {
          console.error('❌ [CAPTURE] Screenshot capture failed:', screenshotErr);
          document.body.removeChild(modelViewer);
          URL.revokeObjectURL(modelViewer.src);
        }
      } else {
        console.error('❌ [RENDER] No outputs from OpenSCAD');
      }

      console.warn('⚠️ [RENDER] Thumbnail rendering failed - using fallback');
      return generateFallbackIcon(scadCode);

    } catch (err) {
      console.error('❌ [RENDER] Failed to generate 3D thumbnail:', err);
      console.log('⚠️ [RENDER] Using fallback icon');
      // Return a fallback SVG icon
      return generateFallbackIcon(scadCode);
    }
  };

  // Generate a fallback SVG icon
  const generateFallbackIcon = (scadCode: string): string => {
    const codeLower = scadCode.toLowerCase();
    
    if (codeLower.includes('cube')) {
      return 'data:image/svg+xml;base64,' + btoa(`
        <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="cubeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect x="60" y="60" width="80" height="80" fill="url(#cubeGrad)" rx="8"/>
        </svg>
      `);
    } else if (codeLower.includes('sphere')) {
      return 'data:image/svg+xml;base64,' + btoa(`
        <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="sphereGrad" cx="30%" cy="30%">
              <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
              <stop offset="40%" style="stop-color:#667eea;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#4c51bf;stop-opacity:1" />
            </radialGradient>
          </defs>
          <circle cx="100" cy="100" r="40" fill="url(#sphereGrad)"/>
        </svg>
      `);
    } else if (codeLower.includes('cylinder')) {
      return 'data:image/svg+xml;base64,' + btoa(`
        <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="cylGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
            </linearGradient>
          </defs>
          <ellipse cx="100" cy="60" rx="40" ry="20" fill="url(#cylGrad)"/>
          <rect x="60" y="60" width="80" height="80" fill="url(#cylGrad)" rx="8"/>
        </svg>
      `);
    } else {
      return 'data:image/svg+xml;base64,' + btoa(`
        <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="genGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
            </linearGradient>
          </defs>
          <polygon points="100,40 140,80 100,120 60,80" fill="url(#genGrad)"/>
        </svg>
      `);
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
          onClick={handleGenerate}
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
          onClick={handleGenerate}
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
