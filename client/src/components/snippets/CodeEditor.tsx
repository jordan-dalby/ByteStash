import React, { useRef, useEffect, useState } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { getMonacoLanguage } from '../../utils/languageUtils';
import * as Monaco from 'monaco-editor/esm/vs/editor/editor.api';

export interface DynamicCodeEditorProps {
  code: string;
  language?: string;
  onValueChange: (value?: string) => void;
  showLineNumbers: boolean;
}

const DynamicCodeEditor: React.FC<DynamicCodeEditorProps> = ({
  code,
  language = 'plaintext',
  onValueChange,
  showLineNumbers = true
}) => {
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const monacoLanguage = getMonacoLanguage(language);
  const [editorHeight, setEditorHeight] = useState<string>("100px");

  useEffect(() => {
    if (editorRef.current) {
      const currentValue = editorRef.current.getValue();
      if (currentValue !== code) {
        editorRef.current.setValue(code);
      }
    }
  }, [code]);

  const updateEditorHeight = () => {
    if (!editorRef.current) return;
    
    const editor = editorRef.current;
    const contentHeight = editor.getContentHeight();
    const maxHeight = 500;
    
    const newHeight = Math.min(maxHeight, Math.max(100, contentHeight));
    
    setEditorHeight(`${newHeight}px`);
    
    const shouldShowScrollbar = contentHeight > maxHeight;
    editor.updateOptions({
      scrollbar: {
        vertical: shouldShowScrollbar ? 'visible' : 'hidden',
        horizontal: 'visible',
        verticalScrollbarSize: 12,
        horizontalScrollbarSize: 12,
      }
    });
    
    editor.layout();
  };

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;

    const editorElement = editor.getDomNode();
    if (editorElement) {
      editorElement.setAttribute('tabindex', '0');
      
      editorElement.addEventListener('click', () => {
        editor.focus();
      });
    }

    editor.onDidContentSizeChange(() => {
      window.requestAnimationFrame(updateEditorHeight);
    });

    editor.focus();
  };

  useEffect(() => {
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        Monaco.editor.setModelLanguage(model, monacoLanguage);
        updateEditorHeight();
      }
    }
  }, [monacoLanguage]);

  useEffect(() => {
    if (editorRef.current) {
      setTimeout(updateEditorHeight, 50);
    }
  }, [code]);

  return (
    <div 
      ref={containerRef} 
      className="overflow-hidden rounded-lg"
      onMouseDown={(e) => {
        if (editorRef.current && e.target === containerRef.current) {
          e.preventDefault();
          editorRef.current.focus();
        }
      }}
    >
      <Editor
        height={editorHeight}
        value={code}
        defaultLanguage={monacoLanguage}
        onChange={(value) => {
          onValueChange?.(value);
          setTimeout(updateEditorHeight, 10);
        }}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 13,
          lineNumbers: showLineNumbers ? 'on' : 'off',
          renderLineHighlight: 'all',
          wordWrap: 'on',
          wrappingIndent: 'indent',
          automaticLayout: true,
          folding: false,
          tabSize: 4,
          formatOnPaste: true,
          formatOnType: true,
          padding: { top: 12, bottom: 12 },
          lineDecorationsWidth: showLineNumbers ? 24 : 50,
          overviewRulerBorder: false,
          scrollbar: {
            vertical: 'visible',
            horizontal: 'visible',
            verticalScrollbarSize: 12,
            horizontalScrollbarSize: 12,
            useShadows: false
          }
        }}
      />
    </div>
  );
};

export default DynamicCodeEditor;