import React, { useEffect, useRef, useState } from 'react';
import { Model } from '../state/model';

interface MiniViewerProps {
  scadCode: string;
  style?: React.CSSProperties;
}

export default function MiniViewer({ scadCode, style }: MiniViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!scadCode || !canvasRef.current) return;

    const renderModel = async () => {
      setIsRendering(true);
      setError(null);

      try {
        // Create a temporary model instance for rendering
        const tempModel = new Model(
          null as any, // No file system needed for mini viewer
          { source: scadCode } as any, // Minimal state
          () => {}, // No state setter needed
          null as any // No state persister needed
        );

        // Set the source code
        tempModel.source = scadCode;

        // Try to render the model
        await tempModel.render({ isPreview: true, now: true });

        // If we have output, try to display it
        if (tempModel.state.output && !tempModel.state.output.isPreview) {
          // For now, we'll show a success indicator
          // In a full implementation, we'd render the actual 3D model
          console.log('Model rendered successfully');
        }
      } catch (err) {
        console.warn('Mini viewer render error:', err);
        setError('Render failed');
      } finally {
        setIsRendering(false);
      }
    };

    renderModel();
  }, [scadCode]);

  return (
    <div 
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        border: '1px solid #e1e5e9',
        ...style
      }}
    >
      {isRendering ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          color: '#6c757d'
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            border: '2px solid #e1e5e9',
            borderTop: '2px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '8px'
          }} />
          <div style={{ fontSize: '12px' }}>Rendering...</div>
        </div>
      ) : error ? (
        <div style={{
          textAlign: 'center',
          color: '#dc3545',
          fontSize: '12px'
        }}>
          <div style={{ fontSize: '16px', marginBottom: '4px' }}>⚠️</div>
          <div>Render Error</div>
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          color: '#6c757d'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎨</div>
          <div style={{ fontSize: '12px' }}>3D Preview</div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
