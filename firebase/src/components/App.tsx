// Portions of this file are Copyright 2021 Google LLC, and licensed under GPL2+. See COPYING.

import React, { CSSProperties, useEffect, useState } from 'react';
import {MultiLayoutComponentId, State, StatePersister} from '../state/app-state'
import { Model } from '../state/model';
import EditorPanel from './EditorPanel';
import ViewerPanel from './ViewerPanel';
import Footer from './Footer';
import { ModelContext, FSContext } from './contexts';
import PanelSwitcher from './PanelSwitcher';
import { ConfirmDialog } from 'primereact/confirmdialog';
import CustomizerPanel from './CustomizerPanel';
import AIPromptPanel from './AIPromptPanel';


export function App({initialState, statePersister, fs}: {initialState: State, statePersister: StatePersister, fs: FS}) {
  const [state, setState] = useState(initialState);
  
  const model = new Model(fs, state, setState, statePersister);
  useEffect(() => model.init());

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F5') {
        event.preventDefault();
        model.render({isPreview: true, now: true})
      } else if (event.key === 'F6') {
        event.preventDefault();
        model.render({isPreview: false, now: true})
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

  const zIndexOfPanelsDependingOnFocus = {
    editor: {
      editor: 3,
      viewer: 1,
      customizer: 0,
    },
    viewer: {
      editor: 2,
      viewer: 3,
      customizer: 1,
    },
    customizer: {
      editor: 0,
      viewer: 1,
      customizer: 3,
    }
  }

  const layout = state.view.layout
  const mode = state.view.layout.mode;
  function getPanelStyle(id: MultiLayoutComponentId): CSSProperties {
    if (layout.mode === 'multi') {
      const itemCount = (layout.editor ? 1 : 0) + (layout.viewer ? 1 : 0) + (layout.customizer ? 1 : 0)
      return {
        flex: 1,
        maxWidth: Math.floor(100/itemCount) + '%',
        display: (state.view.layout as any)[id] ? 'flex' : 'none'
      }
    } else {
      return {
        flex: 1,
        zIndex: Number((zIndexOfPanelsDependingOnFocus as any)[id][layout.focus]),
      }
    }
  }

  return (
    <ModelContext.Provider value={model}>
      <FSContext.Provider value={fs}>
        <div style={{
          display: 'flex',
          height: '100vh',
          backgroundColor: '#f8f9fa',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
          
          {/* Left Side - Two Panels */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            flex: '1',
            gap: '2px',
            padding: '16px',
            paddingRight: '8px'
          }}>
            
            {/* Top Left - Code Editor */}
            <div style={{
              flex: '1',
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '1px solid #e1e5e9',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <div style={{
                padding: '16px',
                borderBottom: '1px solid #e1e5e9',
                backgroundColor: '#f8f9fa',
                fontSize: '14px',
                fontWeight: '600',
                color: '#495057'
              }}>
                OpenSCAD Code
              </div>
              <div style={{ height: 'calc(100% - 49px)' }}>
                <EditorPanel 
                  className="minimal-editor"
                  style={{ 
                    height: '100%',
                    border: 'none',
                    borderRadius: '0'
                  }} 
                />
              </div>
            </div>

            {/* Bottom Left - AI Prompt */}
            <div style={{
              height: '200px',
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '1px solid #e1e5e9',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              overflow: 'hidden'
            }}>
              <AIPromptPanel 
                style={{
                  height: '100%',
                  margin: '0',
                  borderRadius: '0'
                }}
              />
            </div>
          </div>

          {/* Right Side - 3D Viewer */}
          <div style={{
            flex: '1',
            padding: '16px',
            paddingLeft: '8px'
          }}>
            <div style={{
              height: '100%',
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '1px solid #e1e5e9',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <div style={{
                padding: '16px',
                borderBottom: '1px solid #e1e5e9',
                backgroundColor: '#f8f9fa',
                fontSize: '14px',
                fontWeight: '600',
                color: '#495057'
              }}>
                3D Preview
              </div>
              <div style={{ height: 'calc(100% - 49px)' }}>
                <ViewerPanel 
                  style={{ 
                    height: '100%',
                    border: 'none',
                    borderRadius: '0'
                  }} 
                />
              </div>
            </div>
          </div>

          <ConfirmDialog />
        </div>
      </FSContext.Provider>
    </ModelContext.Provider>
  );
}
