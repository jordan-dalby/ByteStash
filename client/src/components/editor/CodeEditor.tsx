import React, { useRef, useEffect, useState } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import * as Monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { getMonacoLanguage } from '../../utils/language/languageUtils';
import { useTheme } from '../../contexts/ThemeContext';

export interface CodeEditorProps {
  code: string;
  language?: string;
  onValueChange: (value?: string) => void;
  showLineNumbers: boolean;
  minHeight?: string;
  maxHeight?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  language = 'plaintext',
  onValueChange,
  showLineNumbers = true,
  minHeight = "100px",
  maxHeight = "500px"
}) => {
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const monacoLanguage = getMonacoLanguage(language);
  const [editorHeight, setEditorHeight] = useState<string>(minHeight);
  const { theme } = useTheme();
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>(
    theme === 'system' 
      ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      : theme
  );
  
  useEffect(() => {
    const updateEffectiveTheme = () => {
      if (theme === 'system') {
        setEffectiveTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      } else {
        setEffectiveTheme(theme);
      }
    };

    updateEffectiveTheme();

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', updateEffectiveTheme);
      return () => mediaQuery.removeEventListener('change', updateEffectiveTheme);
    }
  }, [theme]);

  const isDark = effectiveTheme === 'dark';

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
    const minHeightPx = parseInt(minHeight);
    const maxHeightPx = parseInt(maxHeight);
    
    const newHeight = Math.min(maxHeightPx, Math.max(minHeightPx, contentHeight));
    
    setEditorHeight(`${newHeight}px`);
    
    const shouldShowScrollbar = contentHeight > maxHeightPx;
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

    editor.onDidContentSizeChange(() => {
      window.requestAnimationFrame(updateEditorHeight);
    });

    updateEditorHeight();
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

  return (
    <div ref={containerRef} className="overflow-hidden rounded-lg border border-light-border dark:border-dark-border">
      <Editor
        height={editorHeight}
        value={code}
        defaultLanguage={monacoLanguage}
        onChange={(value) => {
          onValueChange?.(value);
          setTimeout(updateEditorHeight, 10);
        }}
        onMount={handleEditorDidMount}
        theme={isDark ? "vs-dark" : "light"}
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
