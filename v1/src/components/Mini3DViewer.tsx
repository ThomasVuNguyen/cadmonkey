import React, { useEffect, useRef, useState } from 'react';

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
  enabled?: boolean;
  onRenderComplete?: () => void;
  onRenderError?: (err: unknown) => void;
}

type RenderResult = { modelUrl: string } | { imageUrl: string } | { placeholder: true };

const WORKSPACE_DEFAULT_ORBIT = `${Math.PI / 4}rad ${Math.PI / 4}rad auto`;

export default function Mini3DViewer({
  scadCode,
  thumbnail,
  style,
  forceInteractive = false,
  enabled = false,
  onRenderComplete,
  onRenderError,
}: Mini3DViewerProps) {
  const [isRendering, setIsRendering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showPlaceholder, setShowPlaceholder] = useState(false);
  const modelUrlRef = useRef<string | null>(null);

  // Revoke blob URLs only when replacing or unmounting (NOT when enabled toggles).
  useEffect(() => {
    return () => {
      if (modelUrlRef.current?.startsWith('blob:')) {
        URL.revokeObjectURL(modelUrlRef.current);
      }
      modelUrlRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!scadCode) return;

    let cancelled = false;

    const renderModel = async () => {
      const isPlaceholderThumbnail = !!thumbnail && thumbnail.startsWith('data:image/svg+xml');

      // If we already have a REAL thumbnail (not a placeholder), show it immediately (fast path)
      if (thumbnail && !isPlaceholderThumbnail && !forceInteractive) {
        setShowPlaceholder(false);
        setHasError(false);
        setIsRendering(false);
        setModelUrl(null);
        setImageUrl(thumbnail);
        onRenderComplete?.();
        return;
      }

      // If not enabled, don't auto-render heavy previews. Keep any existing rendered result.
      if (!enabled) {
        setIsRendering(false);
        if (!modelUrl && !imageUrl) {
          setShowPlaceholder(true);
        }
        return;
      }

      setIsRendering(true);
      setHasError(false);
      setShowPlaceholder(false);
      // Clear previous rendered results when (re)starting a render
      setModelUrl(null);
      setImageUrl(null);

      try {
        const result = await performRendering(scadCode, thumbnail, true);
        if (cancelled) {
          return;
        }

        if ('placeholder' in result) {
          setShowPlaceholder(true);
        } else if ('modelUrl' in result) {
          // Replace previous blob URL (if any) only after we have a new one.
          const prev = modelUrlRef.current;
          if (prev && prev !== result.modelUrl && prev.startsWith('blob:')) {
            URL.revokeObjectURL(prev);
          }
          modelUrlRef.current = result.modelUrl;
          setModelUrl(result.modelUrl);
          setImageUrl(null);
          onRenderComplete?.();
        } else {
          setImageUrl(result.imageUrl);
          setModelUrl(null);
          onRenderComplete?.();
        }
      } catch (err) {
        console.error('Mini3DViewer rendering failed:', err);
        if (!cancelled) {
          setHasError(true);
        }
        onRenderError?.(err);
      } finally {
        if (!cancelled) {
          setIsRendering(false);
        }
      }
    };

    renderModel();

    return () => {
      cancelled = true;
    };
  }, [scadCode, thumbnail, forceInteractive, enabled]);

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
          orientation="0deg -90deg 0deg"
          camera-orbit={WORKSPACE_DEFAULT_ORBIT}
          environment-image="./skybox-lights.jpg"
          max-camera-orbit="auto 180deg auto"
          min-camera-orbit="auto 0deg auto"
          camera-controls
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

      {!isRendering && !hasError && showPlaceholder && (
        <div style={{ color: '#667085', fontSize: '12px', textAlign: 'center', padding: '8px' }}>
          {enabled ? 'Rendering…' : 'Queued…'}
        </div>
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

    const offText = typeof offBuffer === 'string' ? offBuffer : new TextDecoder().decode(offBuffer);
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
