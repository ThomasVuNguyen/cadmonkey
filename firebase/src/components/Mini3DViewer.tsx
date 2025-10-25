import React, { useEffect, useState } from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': any;
    }
  }
}

interface Mini3DViewerProps {
  scadCode: string;
  thumbnail?: string;
  style?: React.CSSProperties;
  forceInteractive?: boolean;
}

type RenderResult = { modelUrl: string } | { imageUrl: string };

export default function Mini3DViewer({
  scadCode,
  thumbnail,
  style,
  forceInteractive = false,
}: Mini3DViewerProps) {
  const [isRendering, setIsRendering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!scadCode) return;

    let cancelled = false;
    let temporaryModelUrl: string | null = null;

    const cleanup = () => {
      if (temporaryModelUrl) {
        URL.revokeObjectURL(temporaryModelUrl);
        temporaryModelUrl = null;
      }
    };

    const renderModel = async () => {
      setIsRendering(true);
      setHasError(false);
      setModelUrl(null);
      setImageUrl(null);

      try {
        const result = await performRendering(scadCode, thumbnail, forceInteractive);
        if (cancelled) {
          if ('modelUrl' in result) {
            URL.revokeObjectURL(result.modelUrl);
          }
          return;
        }

        if ('modelUrl' in result) {
          temporaryModelUrl = result.modelUrl;
          setModelUrl(result.modelUrl);
          setImageUrl(null);
        } else {
          setImageUrl(result.imageUrl);
          setModelUrl(null);
        }
      } catch (err) {
        console.error('Mini3DViewer rendering failed:', err);
        if (!cancelled) {
          setHasError(true);
        }
      } finally {
        if (!cancelled) {
          setIsRendering(false);
        }
      }
    };

    renderModel();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [scadCode, thumbnail, forceInteractive]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        borderRadius: '16px',
        overflow: 'hidden',
        background: 'radial-gradient(circle at 15% 15%, rgba(243, 246, 252, 0.95), #ffffff)',
        border: '1px solid rgba(148, 163, 184, 0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      {isRendering && (
        <div style={{ color: '#667085', fontSize: '12px' }}>
          Rendering interactive view…
        </div>
      )}

      {!isRendering && hasError && (
        <div style={{ color: '#c0392b', fontSize: '12px', textAlign: 'center', padding: '8px' }}>
          Failed to render model
        </div>
      )}

      {!isRendering && !hasError && modelUrl && (
        <model-viewer
          src={modelUrl}
          camera-controls
          auto-rotate
          ar
          style={{
            width: '100%',
            height: '100%',
          }}
        >
          <span slot="progress-bar"></span>
        </model-viewer>
      )}

      {!isRendering && !hasError && !modelUrl && imageUrl && (
        <img
          src={imageUrl}
          alt="Generated 3D preview"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
    </div>
  );
}

async function performRendering(
  scadCode: string,
  thumbnail?: string,
  forceInteractive?: boolean,
): Promise<RenderResult> {
  if (!forceInteractive && thumbnail) {
    return { imageUrl: thumbnail };
  }

  try {
    const { spawnOpenSCAD } = await import('../runner/openscad-runner');
    const job = spawnOpenSCAD({
      mountArchives: true,
      inputs: [{
        path: '/preview.scad',
        content: scadCode,
      }],
      args: [
        '/preview.scad',
        '-o', 'preview.off',
        '--backend=manifold',
        '--export-format=off',
        '--enable=lazy-union',
      ],
      outputPaths: ['preview.off'],
    }, (streams) => {
      console.log('Mini3DViewer OpenSCAD output:', streams);
    });

    const result = await job;

    if (result.error) {
      throw new Error(String(result.error));
    }

    const offBuffer = result.outputs?.[0]?.[1];
    if (!offBuffer) {
      throw new Error('No OFF output received from OpenSCAD');
    }

    const { parseOff } = await import('../io/import_off');
    const { exportGlb } = await import('../io/export_glb');

    const offText = new TextDecoder().decode(offBuffer);
    const offData = parseOff(offText);
    const glbBlob = await exportGlb(offData);
    const modelUrl = URL.createObjectURL(glbBlob);
    return { modelUrl };
  } catch (err) {
    console.error('Interactive rendering failed, falling back to thumbnail if available.', err);
    if (thumbnail && !forceInteractive) {
      return { imageUrl: thumbnail };
    }
    throw err;
  }
}
