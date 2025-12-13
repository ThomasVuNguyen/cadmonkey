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

  return (
    <ModelContext.Provider value={model}>
      <FSContext.Provider value={fs}>
        <div className="app-shell">
          <header className="app-header">
            <div className="app-title">
              <span className="app-logo-text">cadmonkey</span>
            </div>
            <div className="app-view-toggle">
              <button
                onClick={() => setCurrentView('gallery')}
                className={`toggle-button ${currentView === 'gallery' ? 'is-active' : ''}`}
                aria-label="Switch to Gallery view"
              >
                <span>Gallery</span>
              </button>
              <button
                onClick={() => setCurrentView('workspace')}
                className={`toggle-button ${currentView === 'workspace' ? 'is-active' : ''}`}
                aria-label="Switch to Workspace view"
              >
                <span>Workspace</span>
              </button>
            </div>
            <div className="app-header-right">
              <a
                href="https://discord.gg/rQWPPPNMmZ"
                target="_blank"
                rel="noopener noreferrer"
                className="discord-header-button"
              >
                <span className="discord-icon">💬</span>
                <span className="discord-text">Discord</span>
              </a>
              <div className="app-version">v1.21</div>
            </div>
          </header>

          <main className="app-main">
            {currentView === 'workspace' ? (
              <div className="workspace-card">
                <section className={`editor-pane ${(state.rendering || state.previewing) ? 'processing' : ''}`}>
                  <div className="pane-body editor-surface">
                    <EditorPanel
                      className="minimal-editor"
                      style={{ flex: 1 }}
                    />
                  </div>
                  <div className="pane-footer">
                    <AIPromptPanel
                      variant="compact"
                      className="prompt-panel"
                      initialPrompt={autoRunPrompt}
                    />
                  </div>
                </section>

                <section className={`viewer-pane ${state.output && !state.rendering && !state.previewing ? 'completed' : ''}`}>
                  <div className="pane-body viewer-surface">
                    <ViewerPanel
                      style={{ flex: 1 }}
                    />
                    <div className="viewer-download-button">
                      <ExportButton />
                    </div>
                  </div>
                </section>
              </div>
            ) : currentView === 'gallery' ? (
              <div className="gallery-card-grid">
                <Socials
                  onModelSelect={(scadCode) => {
                    model.source = scadCode;
                    setCurrentView('workspace');
                  }}
                />
              </div>
            ) : (
              <LandingPage
                onStart={(prompt) => {
                  setAutoRunPrompt(prompt);
                  setCurrentView('workspace');
                }}
              />
            )}
          </main>

          <ConfirmDialog />
        </div>
      </FSContext.Provider>
    </ModelContext.Provider>
  );
}