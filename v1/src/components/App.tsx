// Portions of this file are Copyright 2021 Google LLC, and licensed under GPL2+. See COPYING.

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { State, StatePersister } from '../state/app-state';
import { Model } from '../state/model';
import EditorPanel from './EditorPanel';
import ViewerPanel from './ViewerPanel';
import { ModelContext, FSContext } from './contexts';
import { ConfirmDialog } from 'primereact/confirmdialog';
import AIPromptPanel from './AIPromptPanel';
import Socials from './Socials';
import { LandingPage } from './LandingPage';
import ExportButton from './ExportButton';
import './AppLayout.css';
import './LovableWorkspace.css';
import lovableLogo from '../assets/lovable-logo.png';

export function App({ initialState, statePersister, fs }: { initialState: State, statePersister: StatePersister, fs: FS }) {
  const [state, setState] = useState(initialState);
  const [currentView, setCurrentView] = useState<'workspace' | 'gallery' | 'initial'>('initial');
  const [autoRunPrompt, setAutoRunPrompt] = useState<string | null>(null);
  const initCalledRef = useRef(false);

  // Create Model instance once and keep it stable across renders
  const model = useMemo(() => {
    const m = new Model(fs, initialState, setState, statePersister);
    return m;
  }, [fs, statePersister]);

  // Update model's state reference when state changes
  useEffect(() => {
    model.state = state;
  }, [state, model]);

  // Only call init once on mount, and only if there's no output
  useEffect(() => {
    if (!initCalledRef.current && !state.output) {
      initCalledRef.current = true;
      model.init();
    }
  }, [model, state.output]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F5') {
        event.preventDefault();
        model.render({ isPreview: true, now: true })
      } else if (event.key === 'F6') {
        event.preventDefault();
        model.render({ isPreview: false, now: true })
      } else if (event.key === 'F7') {
        event.preventDefault();
        model.export();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const headerDownload = async () => {
    if (state.rendering || state.exporting) return;
    await model.render({ isPreview: false, now: true });
    await model.export();
  };

  const promptPreview = autoRunPrompt ?? 'a cat';
  const sourcePreview = (model.source ?? '').trim();
  const sourceSnippet = sourcePreview
    ? sourcePreview.split('\n').slice(0, 14).join('\n')
    : '// Waiting for your next idea…';

  const renderStatus = state.rendering
    ? 'Rendering'
    : state.previewing
      ? 'Previewing'
      : state.output
        ? 'Ready'
        : 'Idle';

  return (
    <ModelContext.Provider value={model}>
      <FSContext.Provider value={fs}>
        <div className="lovable-shell">
          <header className="lovable-topbar">
            <div className="lovable-brand">
              <div className="lovable-logo">
                <img src={lovableLogo} alt="cadmonkey logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div>
                <div className="lovable-title">cadmonkey</div>
                <div className="lovable-subtle">AI OpenSCAD workspace</div>
              </div>
            </div>

            <div className="lovable-tabs" aria-label="View selector">
              <button
                onClick={() => setCurrentView('workspace')}
                className={`lovable-tab ${currentView === 'workspace' ? 'is-active' : ''}`}
              >
                <svg viewBox="0 0 20 20" fill="none">
                  <path d="M3 5h14v10H3z" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                Workspace
              </button>
              <button
                onClick={() => setCurrentView('gallery')}
                className={`lovable-tab ${currentView === 'gallery' ? 'is-active' : ''}`}
              >
                <svg viewBox="0 0 20 20" fill="none">
                  <path d="M5 9l5 4 5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4 6h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Gallery
              </button>
            </div>

            <div className="lovable-actions">
              <div className="lovable-chip">v1.21</div>
              <a
                href="https://discord.gg/rQWPPPNMmZ"
                target="_blank"
                rel="noopener noreferrer"
                className="lovable-secondary"
              >
                Discord
              </a>
              <button className="lovable-secondary" onClick={() => setCurrentView('initial')}>
                Reset
              </button>
              <button className="lovable-primary" onClick={() => void headerDownload()}>
                Download
              </button>
            </div>
          </header>

          <main className="lovable-content">
            {currentView === 'workspace' ? (
              <>
                <section className="lovable-card" aria-label="AI chat and editor">
                  <div className="lovable-panel-header">
                    <div className="lovable-panel-title">
                      <span>AI Chat</span>
                    </div>
                    <div className="lovable-pill">{renderStatus}</div>
                  </div>

                  <div className="lovable-thread">
                    <div className="lovable-bubble user">hey cadmonkey, make me {promptPreview}</div>
                    <div className="lovable-bubble ai">{sourceSnippet}</div>
                  </div>

                  <div className="lovable-editor-card">
                    <div className="lovable-editor-label">Workspace Editor</div>
                    <div className="lovable-editor">
                      <EditorPanel className="minimal-editor" />
                    </div>
                  </div>

                  <div className="lovable-input-card">
                    <AIPromptPanel
                      variant="default"
                      className="prompt-panel"
                      initialPrompt={autoRunPrompt}
                    />
                  </div>
                </section>

                <section className="lovable-viewer-card" aria-label="Workspace preview">
                  <div className="lovable-panel-header">
                    <div className="lovable-panel-title">
                      <span>Workspace Preview</span>
                      <span className="lovable-badge">Live render</span>
                    </div>
                    {state.output && state.output.displayFileURL && (
                      <span className="lovable-subtle">Output ready</span>
                    )}
                  </div>

                  <div className="lovable-viewer-surface">
                    <ViewerPanel />
                  </div>

                  <div className="lovable-viewer-footer">
                    <div className="lovable-subtle">
                      {state.output?.outFileURL ? 'Export ready' : 'Generate a render to download'}
                    </div>
                    <ExportButton />
                  </div>
                </section>
              </>
            ) : currentView === 'gallery' ? (
              <section className="lovable-viewer-card" aria-label="Gallery">
                <div className="lovable-panel-header">
                  <div className="lovable-panel-title">
                    <span>Gallery</span>
                    <span className="lovable-pill">Community</span>
                  </div>
                </div>
                <Socials
                  onModelSelect={(scadCode) => {
                    model.source = scadCode;
                    setCurrentView('workspace');
                  }}
                />
              </section>
            ) : (
              <section className="lovable-card" aria-label="Get started">
                <LandingPage
                  onStart={(prompt) => {
                    setAutoRunPrompt(prompt);
                    setCurrentView('workspace');
                  }}
                />
              </section>
            )}
          </main>

          <ConfirmDialog />
        </div>
      </FSContext.Provider>
    </ModelContext.Provider>
  );
}
