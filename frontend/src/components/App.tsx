// Portions of this file are Copyright 2021 Google LLC, and licensed under GPL2+. See COPYING.

import React, { useEffect, useState } from 'react';
import { State, StatePersister } from '../state/app-state';
import { Model } from '../state/model';
import EditorPanel from './EditorPanel';
import ViewerPanel from './ViewerPanel';
import { ModelContext, FSContext } from './contexts';
import { ConfirmDialog } from 'primereact/confirmdialog';
import AIPromptPanel from './AIPromptPanel';
import Socials from './Socials';
import { LandingPage } from './LandingPage';
import './AppLayout.css';

export function App({ initialState, statePersister, fs }: { initialState: State, statePersister: StatePersister, fs: FS }) {
  const [state, setState] = useState(initialState);
  const [currentView, setCurrentView] = useState<'workspace' | 'gallery' | 'initial'>('initial');
  const [autoRunPrompt, setAutoRunPrompt] = useState<string | null>(null);

  const model = new Model(fs, state, setState, statePersister);
  useEffect(() => model.init());

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
              <img src="/icon.png" alt="CADMonkey" className="app-logo" />
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
                  <div className="pane-header">
                    <div className="pane-title">OpenSCAD Editor</div>
                  </div>
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
                  <div className="pane-header">
                    <div className="pane-title">3D Preview</div>
                  </div>
                  <div className="pane-body viewer-surface">
                    <ViewerPanel
                      style={{ flex: 1 }}
                    />
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