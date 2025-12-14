
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

    useEffect(() => {
        return () => {
            if (modelUrlRef.current) {
                URL.revokeObjectURL(modelUrlRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!scadCode) {
            setModelUrl(null);
            setError(null);
            setIsRendering(false);
            return;
        }

        let cancelled = false;

        const render = async () => {
            console.log('🎨 [Mini3DViewer] Starting render...', scadCode.substring(0, 50) + '...');
            setIsRendering(true);
            setError(null);

            try {
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

                if (cancelled) {
                    console.log('❌ [Mini3DViewer] Render cancelled');
                    return;
                }

                if (result.error) {
                    console.error('❌ [OpenSCAD] Error:', result.error);
                    throw new Error(result.error);
                }

                const offBuffer = result.outputs?.[0]?.[1];
                if (!offBuffer) {
                    console.error('❌ [OpenSCAD] No output generated');
                    throw new Error('No OFF output received from OpenSCAD');
                }

                const offText = offBuffer; // In the worker/runner, readFile returns string or Uint8Array. 
                // Our worker implementation returns string for text files usually, but let's check.
                // Actually our runner/worker impl returns string from FS.readFile for text?
                // Emscripten FS.readFile return formatting depends on options.
                // In openscad-worker.ts: instance.FS.readFile(path) -> defaults to Uint8Array usually?
                // Let's assume text for now or handle both?
                // parseOff expects string.

                let textContent = '';
                if (typeof offText === 'string') {
                    textContent = offText;
                } else {
                    textContent = new TextDecoder().decode(offText as any);
                }

                console.log('✅ [OpenSCAD] Parsing OFF data...');
                const offData = parseOff(textContent);
                console.log('✅ [OpenSCAD] OFF parsed, vertices:', offData.vertices.length);

                console.log('✅ [OpenSCAD] Converting to GLB...');
                const glbBlob = await exportGlb(offData);
                console.log('✅ [OpenSCAD] GLB created, size:', glbBlob.size, 'bytes');

                const url = URL.createObjectURL(glbBlob);
                console.log('✅ [OpenSCAD] Object URL created:', url.substring(0, 50) + '...');

                if (modelUrlRef.current) {
                    URL.revokeObjectURL(modelUrlRef.current);
                }
                modelUrlRef.current = url;
                setModelUrl(url);
                console.log('🎉 [Mini3DViewer] Render complete!');

            } catch (err: any) {
                console.error('❌ [Mini3DViewer] Render failed:', err);
                if (!cancelled) {
                    setError(err.message || 'Render failed');
                    setModelUrl(null);
                }
            } finally {
                if (!cancelled) {
                    setIsRendering(false);
                }
            }
        };

        render();

        return () => {
            cancelled = true;
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
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-2"></div>
                        <div className="text-sm text-gray-600">Rendering 3D model...</div>
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
