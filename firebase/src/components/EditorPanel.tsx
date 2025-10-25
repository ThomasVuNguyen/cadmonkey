// Portions of this file are Copyright 2021 Google LLC, and licensed under GPL2+. See COPYING.

import React, { CSSProperties, useContext, useRef, useState } from 'react';
import Editor, { loader, Monaco } from '@monaco-editor/react';
import openscadEditorOptions from '../language/openscad-editor-options.ts';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { ModelContext } from './contexts.ts';

// const isMonacoSupported = false;
const isMonacoSupported = (() => {
  const ua = window.navigator.userAgent;
  const iosWk = ua.match(/iPad|iPhone/i) && ua.match(/WebKit/i);
  return !iosWk;
})();

let monacoInstance: Monaco | null = null;
if (isMonacoSupported) {
  loader.init().then(mi => monacoInstance = mi);
}

export default function EditorPanel({className, style}: {className?: string, style?: CSSProperties}) {
  const model = useContext(ModelContext);
  if (!model) throw new Error('No model');

  const state = model.state;
  const [editor, setEditor] = useState(null as monaco.editor.IStandaloneCodeEditor | null)

  if (editor) {
    const checkerRun = state.lastCheckerRun;
    const editorModel = editor.getModel();
    if (editorModel) {
      if (checkerRun && monacoInstance) {
        monacoInstance.editor.setModelMarkers(editorModel, 'openscad', checkerRun.markers);
      }
    }
  }

  const onMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    setEditor(editor);
    
    // Auto-render on changes
    editor.onDidChangeModelContent(() => {
      const newSource = editor.getValue();
      if (newSource !== model.source) {
        model.source = newSource;
        // Auto-render after a short delay
        setTimeout(() => {
          model.render({isPreview: true, now: false});
        }, 1000);
      }
    });
  };

  if (!isMonacoSupported) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: '#666',
        fontSize: '14px'
      }}>
        Monaco Editor not supported on this device
      </div>
    );
  }

  return (
    <div className={className} style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
      ...style
    }}>
      <Editor
        height="100%"
        defaultLanguage="openscad"
        value={model.source}
        onMount={onMount}
        options={{
          ...openscadEditorOptions,
          fontSize: 14,
          fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
          lineHeight: 1.5,
          padding: { top: 16, bottom: 16 },
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          wordWrap: 'on',
          theme: 'vs-light'
        }}
        theme="vs-light"
      />
    </div>
  );
}