
import React, { useEffect, useRef, useState } from 'react';
import { spawnOpenSCAD } from '../lib/runner/openscad-runner';
import { parseOff } from '../lib/io/import_off';
import { exportGlb } from '../lib/io/export_glb';

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'model-viewer': any;
        }
    }
}

interface Mini3DViewerProps {
    scadCode: string;
    style?: React.CSSProperties;
}

const WORKSPACE_DEFAULT_ORBIT = `${Math.PI / 4}rad ${Math.PI / 4}rad auto`;

export default function Mini3DViewer({
    scadCode,
    style,
}: Mini3DViewerProps) {
    const [isRendering, setIsRendering] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [modelUrl, setModelUrl] = useState<string | null>(null);
    const modelUrlRef = useRef<string | null>(null);
    const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const currentRenderRef = useRef<string>(''); // Track which code is being rendered

    useEffect(() => {
        return () => {
            if (modelUrlRef.current) {
                URL.revokeObjectURL(modelUrlRef.current);
            }
            if (renderTimeoutRef.current) {
                clearTimeout(renderTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        // Clear previous timeout
        if (renderTimeoutRef.current) {
            clearTimeout(renderTimeoutRef.current);
        }

        if (!scadCode.trim()) {
            // Clear model when code is empty
            if (modelUrlRef.current) {
                URL.revokeObjectURL(modelUrlRef.current);
                modelUrlRef.current = null;
            }
            setModelUrl(null);
            setError(null);
            setIsRendering(false);
            currentRenderRef.current = '';
            return;
        }

        // Clear previous model if code changed significantly (new prompt)
        const previousLength = currentRenderRef.current.length;
        const currentLength = scadCode.length;
        if (previousLength > 100 && currentLength < previousLength * 0.3) {
            // Significant code reduction - likely new prompt
            if (modelUrlRef.current) {
                URL.revokeObjectURL(modelUrlRef.current);
                modelUrlRef.current = null;
            }
            setModelUrl(null);
            setError(null);
        }

        let cancelled = false;

        const render = async () => {
            // Always render the latest code - simple approach
            const codeToRender = scadCode;
            currentRenderRef.current = codeToRender;
            
            console.log('🎨 [Mini3DViewer] Starting render...', codeToRender.substring(0, 50) + '...');
            setIsRendering(true);
            setError(null);

            try {
                const job = spawnOpenSCAD({
                    mountArchives: true,
                    inputs: [{
                        path: '/preview.scad',
                        content: codeToRender,
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
                    if ('stderr' in streams) {
                        console.log('⚠️ [OpenSCAD stderr]:', streams.stderr);
                    }
                });

                const result = await job;
                console.log('📊 [OpenSCAD] Render result:', {
                    error: result.error,
                    hasOutputs: !!result.outputs,
                    outputCount: result.outputs?.length,
                    elapsedMillis: result.elapsedMillis
                });

                // Only update if this render is still for the current code
                if (cancelled || scadCode !== codeToRender) {
                    console.log('⚠️ [Mini3DViewer] Render outdated, discarding');
                    setIsRendering(false);
                    return;
                }

                if (result.error) {
                    console.error('❌ [OpenSCAD] Error:', result.error);
                    setError(result.error);
                    setIsRendering(false);
                    return;
                }

                const offBuffer = result.outputs?.[0]?.[1];
                if (!offBuffer) {
                    console.error('❌ [OpenSCAD] No output generated');
                    setError('No OFF output received from OpenSCAD');
                    setIsRendering(false);
                    return;
                }

                let textContent = '';
                if (typeof offBuffer === 'string') {
                    textContent = offBuffer;
                } else {
                    textContent = new TextDecoder().decode(offBuffer as any);
                }

                // Final check - only update if still current
                if (scadCode !== codeToRender || cancelled) {
                    console.log('⚠️ [Mini3DViewer] Code changed before model update, discarding');
                    setIsRendering(false);
                    return;
                }

                console.log('✅ [OpenSCAD] Parsing OFF data...');
                const offData = parseOff(textContent);
                console.log('✅ [OpenSCAD] OFF parsed, vertices:', offData.vertices.length);

                console.log('✅ [OpenSCAD] Converting to GLB...');
                const glbBlob = await exportGlb(offData);
                console.log('✅ [OpenSCAD] GLB created, size:', glbBlob.size, 'bytes');

                const url = URL.createObjectURL(glbBlob);
                console.log('✅ [OpenSCAD] Object URL created:', url.substring(0, 50) + '...');

                // Final check before updating state
                if (scadCode === codeToRender && !cancelled) {
                    if (modelUrlRef.current) {
                        URL.revokeObjectURL(modelUrlRef.current);
                    }
                    modelUrlRef.current = url;
                    setModelUrl(url);
                    setError(null);
                    setIsRendering(false);
                    console.log('🎉 [Mini3DViewer] Render complete!');
                } else {
                    // Code changed, clean up
                    URL.revokeObjectURL(url);
                    setIsRendering(false);
                }

            } catch (err: any) {
                console.error('❌ [Mini3DViewer] Render failed:', err);
                // Only show error if this render is still current
                if (scadCode === codeToRender && !cancelled) {
                    setError(err.message || 'Render failed');
                }
                setIsRendering(false);
            }
        };

        // Simple debouncing: render after 100ms of no changes
        // This allows progressive rendering as code streams in
        renderTimeoutRef.current = setTimeout(() => {
            if (!cancelled) {
                render();
            }
        }, 100);

        return () => {
            cancelled = true;
            if (renderTimeoutRef.current) {
                clearTimeout(renderTimeoutRef.current);
            }
        };
    }, [scadCode]);

    return (
        <div
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                minHeight: '600px',
                backgroundColor: '#f5f5f5',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                ...style,
            }}
        >
            {/* Rendering state */}
            {isRendering && (
                <div className="absolute inset-0 flex items-center justify-center z-10" style={{ backgroundColor: 'rgba(245, 245, 245, 0.95)' }}>
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-2" style={{ borderColor: '#212121' }}></div>
                        <div className="text-sm font-medium" style={{ color: '#212121' }}>Rendering 3D model...</div>
                    </div>
                </div>
            )}

            {/* Error state */}
            {error && !isRendering && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-50 p-4">
                    <div className="text-center max-w-md">
                        <svg className="w-12 h-12 mx-auto mb-2 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-sm text-red-600 font-medium mb-1">Rendering Failed</div>
                        <div className="text-xs text-red-500">{error}</div>
                    </div>
                </div>
            )}

            {/* 3D Model viewer */}
            {modelUrl && !error && (
                <model-viewer
                    src={modelUrl}
                    orientation="0deg -90deg 0deg"
                    camera-orbit={WORKSPACE_DEFAULT_ORBIT}
                    environment-image="/skybox-lights.jpg"
                    shadow-intensity="1"
                    camera-controls
                    auto-rotate
                    style={{
                        width: '100%',
                        height: '100%',
                        minHeight: '0',
                        flex: 1,
                    }}
                >
                </model-viewer>
            )}
        </div>
    );
}
