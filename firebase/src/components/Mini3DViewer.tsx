import React, { useEffect, useRef, useState } from 'react';
import { Model } from '../state/model';

interface Mini3DViewerProps {
  scadCode: string;
  prompt?: string;
  thumbnail?: string;
  style?: React.CSSProperties;
}

export default function Mini3DViewer({ scadCode, prompt, thumbnail, style }: Mini3DViewerProps) {
  const [isRendering, setIsRendering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modelRef = useRef<Model | null>(null);
  const viewerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scadCode) return;

    const generatePreview = async () => {
      // If we already have a thumbnail, use it!
      if (thumbnail) {
        console.log('🖼️ [MINI3DVIEWER] Using pre-rendered thumbnail');
        console.log('🔗 [MINI3DVIEWER] Thumbnail URL:', thumbnail);
        console.log('📏 [MINI3DVIEWER] URL length:', thumbnail.length);
        console.log('🎯 [MINI3DVIEWER] URL type:', thumbnail.startsWith('data:') ? 'Data URL' : thumbnail.startsWith('http') ? 'HTTP URL' : 'Unknown');
        setPreviewImage(thumbnail);
        setIsRendering(false);
        setHasError(false);
        return;
      }

      console.log('⚠️ [MINI3DVIEWER] No thumbnail URL available, will attempt live rendering');

      // Otherwise, render it live (only for models without thumbnails)
      setIsRendering(true);
      setHasError(false);
      setPreviewImage(null);

      try {
        console.log('No thumbnail available - rendering 3D for:', scadCode.substring(0, 50) + '...');

        const result = await renderOpenSCADDirectly(scadCode);

        if (result) {
          setPreviewImage(result);
          setIsRendering(false);
          return;
        }

        // If actual OpenSCAD rendering fails, show error
        console.error('ACTUAL OpenSCAD rendering failed - no fallbacks allowed');
        throw new Error('Failed to render actual 3D model - OpenSCAD rendering failed');

      } catch (err) {
        console.error('3D RENDERING FAILED:', err);
        setHasError(true);
        setIsRendering(false);
        setPreviewImage(null);
      }
    };

    generatePreview();
  }, [scadCode, thumbnail]);

  // ACTUAL OpenSCAD rendering using the main rendering system
  const renderOpenSCADDirectly = async (scadCode: string): Promise<string | null> => {
    try {
      console.log('Attempting ACTUAL OpenSCAD rendering...');

      // Import the spawnOpenSCAD function to render the actual code
      const { spawnOpenSCAD } = await import('../runner/openscad-runner');

      // Use spawnOpenSCAD to render the OpenSCAD code to STL
      const job = spawnOpenSCAD({
        mountArchives: true,
        inputs: [{
          path: '/preview.scad',
          content: scadCode
        }],
        args: [
          '/preview.scad',
          '-o', 'preview.stl',
          '--backend=manifold',
          '--export-format=binstl'
        ],
        outputPaths: ['preview.stl']
      }, (streams) => {
        console.log('OpenSCAD output:', streams);
      });

      // Wait for the rendering to complete
      const result = await job;

      if (result.error) {
        console.error('OpenSCAD rendering error:', result.error);
        return null;
      }

      if (result.outputs && result.outputs.length > 0) {
        const [, content] = result.outputs[0];
        console.log('OpenSCAD rendering successful, capturing 3D model...');

        // Create a temporary model-viewer element to display the 3D model
        const modelViewer = document.createElement('model-viewer') as any;
        const blob = new Blob([content], { type: 'application/octet-stream' });
        modelViewer.src = URL.createObjectURL(blob);
        modelViewer.style.width = '200px';
        modelViewer.style.height = '200px';
        modelViewer.style.position = 'absolute';
        modelViewer.style.top = '-9999px';
        modelViewer.style.left = '-9999px';
        modelViewer.style.visibility = 'hidden';
        modelViewer.setAttribute('camera-controls', '');
        modelViewer.setAttribute('auto-rotate', '');

        // Add to DOM temporarily
        document.body.appendChild(modelViewer);

        // Wait for model to load and render
        await new Promise((resolve) => {
          modelViewer.addEventListener('load', () => {
            // Give it extra time to render
            setTimeout(resolve, 500);
          });
          setTimeout(resolve, 3000); // 3 second max timeout
        });

        // Capture screenshot using toDataURL like ViewerPanel does
        try {
          const dataUrl = await modelViewer.toDataURL('image/png', 0.8);

          // Clean up
          document.body.removeChild(modelViewer);
          URL.revokeObjectURL(modelViewer.src);

          if (dataUrl) {
            console.log('Successfully captured actual 3D model');
            return dataUrl;
          }
        } catch (screenshotErr) {
          console.error('Screenshot capture failed:', screenshotErr);
          document.body.removeChild(modelViewer);
          URL.revokeObjectURL(modelViewer.src);
        }
      }

      console.error('OpenSCAD rendering failed - no data returned');
      return null;

    } catch (err) {
      console.error('ACTUAL OpenSCAD rendering failed:', err);
      return null;
    }
  };

  const captureModelImage = async (model: Model): Promise<string | null> => {
    try {
      console.log('Attempting to capture 3D model image...');
      console.log('Model state:', model.state);
      console.log('Model output:', model.state.output);
      
      // Check if model has rendered output
      if (!model.state.output) {
        console.error('NO MODEL OUTPUT - Model has no output state');
        return null;
      }
      
      if (model.state.output.isPreview) {
        console.error('PREVIEW MODE - Model is in preview mode, not rendered');
        return null;
      }

      // Try to get the 3D viewer element and capture it
      const modelViewer = viewerRef.current?.querySelector('model-viewer');
      if (modelViewer) {
        console.log('Found model-viewer element, attempting screenshot...');
        try {
          const canvas = await (modelViewer as any).getScreenshot();
          if (canvas) {
            console.log('Successfully captured model-viewer screenshot');
            return canvas.toDataURL('image/png');
          } else {
            console.error('Model-viewer screenshot returned null');
          }
        } catch (screenshotError) {
          console.error('Model-viewer screenshot failed:', screenshotError);
        }
      } else {
        console.error('NO MODEL-VIEWER ELEMENT FOUND');
      }

      // Try canvas fallback
      if (canvasRef.current) {
        console.log('Attempting canvas capture...');
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.error('Canvas context not available');
          return null;
        }

        // Set canvas size
        canvas.width = 200;
        canvas.height = 200;

        // This is NOT a real 3D capture - this is a placeholder
        console.error('USING PLACEHOLDER CANVAS - NOT REAL 3D CAPTURE');
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#dc3545';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('NOT REAL 3D', canvas.width / 2, canvas.height / 2);

        return canvas.toDataURL('image/png');
      }

      console.error('NO CAPTURE METHOD AVAILABLE');
      return null;
    } catch (err) {
      console.error('CAPTURE MODEL IMAGE FAILED:', err);
      return null;
    }
  };

  // NO THUMBNAIL FALLBACK - Always render actual 3D model

  // NO FALLBACKS ALLOWED - Must render actual 3D model

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
        overflow: 'hidden',
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
          <div style={{ fontSize: '12px' }}>Rendering 3D...</div>
        </div>
      ) : hasError ? (
        <div style={{
          textAlign: 'center',
          color: '#dc3545',
          fontSize: '10px',
          padding: '8px',
          backgroundColor: '#f8d7da',
          borderRadius: '4px',
          border: '1px solid #f5c6cb'
        }}>
          <div style={{ fontSize: '14px', marginBottom: '4px' }}>⚠️</div>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>3D RENDERING FAILED</div>
          <div style={{ fontSize: '8px', color: '#721c24' }}>
            No fallback allowed - must render actual 3D model
          </div>
        </div>
      ) : previewImage ? (
        <img
          src={previewImage}
          alt="3D Preview"
          onError={(e) => {
            console.error('Failed to load thumbnail image:', previewImage);
            setHasError(true);
            setPreviewImage(null);
          }}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        />
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6c757d'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎨</div>
          <div style={{ fontSize: '12px' }}>Loading preview...</div>
        </div>
      )}

      {/* Hidden 3D viewer for actual rendering */}
      <div 
        ref={viewerRef}
        style={{
          position: 'absolute',
          top: '-9999px',
          left: '-9999px',
          width: '200px',
          height: '200px',
          visibility: 'hidden'
        }}
      >
        {modelRef.current && (
          <div style={{ width: '200px', height: '200px' }}>
            {/* This will be populated by the Model's render method */}
          </div>
        )}
      </div>

      {/* Hidden canvas for fallback rendering */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: '-9999px',
          left: '-9999px',
          width: '200px',
          height: '200px',
          visibility: 'hidden'
        }}
      />

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}