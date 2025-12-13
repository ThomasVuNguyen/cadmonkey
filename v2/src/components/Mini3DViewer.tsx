
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
        if (!scadCode) return;

        let cancelled = false;

        const render = async () => {
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
                    console.log('OpenSCAD output:', streams);
                });

                const result = await job;

                if (cancelled) return;

                if (result.error) {
                    throw new Error(result.error);
                }

                const offBuffer = result.outputs?.[0]?.[1];
                if (!offBuffer) {
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

                const offData = parseOff(textContent);
                const glbBlob = await exportGlb(offData);
                const url = URL.createObjectURL(glbBlob);

                if (modelUrlRef.current) URL.revokeObjectURL(modelUrlRef.current);
                modelUrlRef.current = url;
                setModelUrl(url);

            } catch (err: any) {
                console.error('Render failed:', err);
                if (!cancelled) setError(err.message || 'Render failed');
            } finally {
                if (!cancelled) setIsRendering(false);
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
                ...style,
            }}
        >
            {isRendering && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/5 z-10">
                    <div className="text-sm text-gray-600">Rendering...</div>
                </div>
            )}

            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-50 p-4">
                    <div className="text-sm text-red-600 center">{error}</div>
                </div>
            )}

            {modelUrl && (
                <model-viewer
                    src={modelUrl}
                    orientation="0deg -90deg 0deg"
                    camera-orbit={WORKSPACE_DEFAULT_ORBIT}
                    environment-image="/skybox-lights.jpg"
                    shadow-intensity="1"
                    camera-controls
                    style={{ width: '100%', height: '100%' }}
                >
                </model-viewer>
            )}
        </div>
    );
}
