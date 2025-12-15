
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
    const lastCodeRef = useRef<string>('');
    const lastChangeTimeRef = useRef<number>(0);
    const renderInProgressRef = useRef<boolean>(false);
    const stableCodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const hadModelRef = useRef<boolean>(false);

    useEffect(() => {
        return () => {
            if (modelUrlRef.current) {
                URL.revokeObjectURL(modelUrlRef.current);
            }
            if (stableCodeTimeoutRef.current) {
                clearTimeout(stableCodeTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!scadCode) {
            // If we had a model and code becomes empty, clear it (new prompt starting)
            if (hadModelRef.current || modelUrlRef.current) {
                console.log('🔄 [Mini3DViewer] Code cleared - clearing previous model');
                if (modelUrlRef.current) {
                    URL.revokeObjectURL(modelUrlRef.current);
                    modelUrlRef.current = null;
                }
                setModelUrl(null);
                hadModelRef.current = false;
            }
            setError(null);
            setIsRendering(false);
            lastCodeRef.current = '';
            return;
        }

        let cancelled = false;
        const now = Date.now();
        const codeChanged = scadCode !== lastCodeRef.current;
        
        // Detect if code has reset (new prompt started)
        // This happens when code goes from long to short (significant decrease)
        const previousLength = lastCodeRef.current.length;
        const currentLength = scadCode.length;
        const isCodeReset = previousLength > 100 && currentLength < previousLength * 0.3;
        
        // If code reset detected, clear the previous model immediately and reset tracking
        if (isCodeReset) {
            console.log('🔄 [Mini3DViewer] Code reset detected - clearing previous model');
            if (modelUrlRef.current) {
                URL.revokeObjectURL(modelUrlRef.current);
                modelUrlRef.current = null;
            }
            setModelUrl(null);
            setError(null);
            setIsRendering(false);
            renderInProgressRef.current = false;
            hadModelRef.current = false;
            // Reset tracking refs so new code stream is detected correctly
            lastCodeRef.current = scadCode;
            lastChangeTimeRef.current = now;
            // Continue to allow render to start with new code
        } else if (codeChanged) {
            // Track code changes for streaming detection
            lastChangeTimeRef.current = now;
            lastCodeRef.current = scadCode;
        }

        // Calculate time since last change AFTER potential reset
        const timeSinceLastChange = now - lastChangeTimeRef.current;

        // Helper function to check if code looks complete (has balanced braces)
        const isCodeComplete = (code: string): boolean => {
            if (!code.trim()) return false;
            const openBraces = (code.match(/\{/g) || []).length;
            const closeBraces = (code.match(/\}/g) || []).length;
            const trimmed = code.trim();
            // Code is likely complete if braces are balanced and ends properly
            return openBraces === closeBraces && openBraces > 0 && 
                   (trimmed.endsWith(';') || trimmed.endsWith('}') || trimmed.endsWith(')'));
        };

        // Detect if code is actively streaming (changing frequently)
        // After reset, treat as streaming to start rendering quickly
        const isStreaming = (isCodeReset || codeChanged) && timeSinceLastChange < 500;
        const codeComplete = isCodeComplete(scadCode);
        
        // Clear any existing stable code timeout
        if (stableCodeTimeoutRef.current) {
            clearTimeout(stableCodeTimeoutRef.current);
            stableCodeTimeoutRef.current = null;
        }

        const render = async () => {
            // Prevent multiple simultaneous renders
            if (renderInProgressRef.current) {
                return;
            }

            // Capture the code at render start to verify it hasn't changed
            const codeAtRenderStart = scadCode;
            renderInProgressRef.current = true;
            console.log('🎨 [Mini3DViewer] Starting render...', scadCode.substring(0, 50) + '...');
            setIsRendering(true);
            // Don't clear error immediately - let it persist if code is incomplete
            // Only clear error on successful render

            try {
                const job = spawnOpenSCAD({
                    mountArchives: true,
                    inputs: [{
                        path: '/preview.scad',
                        content: codeAtRenderStart,
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

                // Check if render was cancelled or code changed
                if (cancelled || scadCode !== codeAtRenderStart) {
                    console.log('❌ [Mini3DViewer] Render cancelled or code changed');
                    renderInProgressRef.current = false;
                    setIsRendering(false); // Always clear rendering state
                    return;
                }

                // Verify code hasn't changed before processing result
                if (scadCode !== codeAtRenderStart) {
                    console.log('⚠️ [Mini3DViewer] Code changed during render, discarding result');
                    renderInProgressRef.current = false;
                    setIsRendering(false);
                    return;
                }

                if (result.error) {
                    // During streaming, suppress errors for incomplete code
                    // Only show errors if code has been stable for a while
                    const isStable = !isStreaming && timeSinceLastChange > 1000;
                    if (isStable || codeComplete) {
                        console.error('❌ [OpenSCAD] Error:', result.error);
                        if (!cancelled && scadCode === codeAtRenderStart) {
                            setError(result.error);
                        }
                    } else {
                        console.log('⚠️ [OpenSCAD] Error during streaming (suppressed):', result.error);
                        // Don't set error during streaming - code is likely incomplete
                    }
                    renderInProgressRef.current = false;
                    setIsRendering(false);
                    return;
                }

                const offBuffer = result.outputs?.[0]?.[1];
                if (!offBuffer) {
                    const isStable = !isStreaming && timeSinceLastChange > 1000;
                    if (isStable || codeComplete) {
                        console.error('❌ [OpenSCAD] No output generated');
                        if (!cancelled && scadCode === codeAtRenderStart) {
                            setError('No OFF output received from OpenSCAD');
                        }
                    }
                    renderInProgressRef.current = false;
                    setIsRendering(false);
                    return;
                }

                let textContent = '';
                if (typeof offBuffer === 'string') {
                    textContent = offBuffer;
                } else {
                    textContent = new TextDecoder().decode(offBuffer as any);
                }

                // Final check before updating model - ensure code hasn't changed
                if (scadCode !== codeAtRenderStart || cancelled) {
                    console.log('⚠️ [Mini3DViewer] Code changed or cancelled before model update, discarding');
                    renderInProgressRef.current = false;
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

                // Final verification before state update
                if (scadCode === codeAtRenderStart && !cancelled) {
                    if (modelUrlRef.current) {
                        URL.revokeObjectURL(modelUrlRef.current);
                    }
                    modelUrlRef.current = url;
                    setModelUrl(url);
                    hadModelRef.current = true; // Track that we have a model
                    setError(null); // Clear error on successful render
                    setIsRendering(false);
                    renderInProgressRef.current = false;
                    console.log('🎉 [Mini3DViewer] Render complete!');
                } else {
                    // Code changed, clean up the URL we created
                    URL.revokeObjectURL(url);
                    renderInProgressRef.current = false;
                    setIsRendering(false);
                }

            } catch (err: any) {
                console.error('❌ [Mini3DViewer] Render failed:', err);
                // Only update state if code hasn't changed
                if (scadCode === codeAtRenderStart && !cancelled) {
                    const isStable = !isStreaming && timeSinceLastChange > 1000;
                    if (isStable || codeComplete) {
                        // Only show errors for stable/complete code
                        setError(err.message || 'Render failed');
                    } else {
                        console.log('⚠️ [Mini3DViewer] Error during streaming (suppressed)');
                    }
                }
                renderInProgressRef.current = false;
                setIsRendering(false); // Always clear rendering state
            }
        };

        // Progressive rendering strategy:
        // - During streaming: render very quickly (50ms) to show progress
        // - When code looks complete: render immediately (0ms delay)
        // - When code stabilizes: render after a short delay (200ms) to catch final state
        // - After code reset: render immediately to start fresh
        let delay = 50; // Default: fast rendering during streaming
        
        if (isCodeReset) {
            delay = 0; // Render immediately after reset to start fresh
        } else if (codeComplete) {
            delay = 0; // Render immediately for complete code
        } else if (!isStreaming && timeSinceLastChange > 500) {
            // Code has stabilized but might not be complete - wait a bit
            delay = 200;
        }
        
        const timeoutId = setTimeout(() => {
            if (!cancelled && !renderInProgressRef.current) {
                render();
            }
        }, delay);

        return () => {
            cancelled = true;
            clearTimeout(timeoutId);
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
