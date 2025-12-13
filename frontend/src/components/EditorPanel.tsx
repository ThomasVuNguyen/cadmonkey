// Portions of this file are Copyright 2021 Google LLC, and licensed under GPL2+. See COPYING.

import React, { CSSProperties, useContext, useEffect, useRef, useState } from 'react';
import Editor, { loader, Monaco } from '@monaco-editor/react';
import openscadEditorOptions from '../language/openscad-editor-options.ts';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { ModelContext } from './contexts.ts';
import './EditorPanel.css';

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
  const lastSourceLenRef = useRef<number>(model.source?.length ?? 0);

  if (editor) {
    const checkerRun = state.lastCheckerRun;
    const editorModel = editor.getModel();
    if (editorModel) {
      if (checkerRun && monacoInstance) {
        monacoInstance.editor.setModelMarkers(editorModel, 'openscad', checkerRun.markers);
      }
    }
  }

  // Keep the view scrolled to the bottom while streaming code, without fighting the user.
  useEffect(() => {
    if (!editor) return;
    const editorModel = editor.getModel();
    if (!editorModel) return;

    const nextLen = model.source?.length ?? 0;
    const prevLen = lastSourceLenRef.current;
    lastSourceLenRef.current = nextLen;

    // Only react when content grows (typical for streaming generation).
    if (nextLen <= prevLen) return;

    const endLine = editorModel.getLineCount();
    const pos = editor.getPosition();
    const currentLine = pos?.lineNumber ?? endLine;
    const isNearBottom = (endLine - currentLine) <= 3;
    const shouldFollow = !editor.hasTextFocus() || isNearBottom;

    if (!shouldFollow) return;

    // Move cursor to end + reveal last line.
    editor.setPosition({ lineNumber: endLine, column: editorModel.getLineMaxColumn(endLine) });
    editor.revealLineNearTop(endLine);
  }, [editor, model.source]);

  const onMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    setEditor(editor);
    
    // Avoid triggering auto-render on initial mount / programmatic sync
    let isInitializing = true;
    const currentValue = editor.getValue();
    if (currentValue !== model.source) {
      editor.setValue(model.source);
    }
    isInitializing = false;

    // Auto-render on changes (only user edits)
    editor.onDidChangeModelContent(() => {
      if (isInitializing) return;
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
    <div className={`monaco-editor-container ${className ?? ''}`} style={{
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
          renderLineHighlight: 'none',
          scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
        }}
        theme="vs-dark"
      />
    </div>
  );
}