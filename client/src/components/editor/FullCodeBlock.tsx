import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, oneLight } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { getLanguageLabel, getMonacoLanguage } from '../../utils/language/languageUtils';
import CopyButton from '../common/buttons/CopyButton';
import { useTheme } from '../../contexts/ThemeContext';
import RawButton from '../common/buttons/RawButton';

export interface FullCodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  isPublicView?: boolean;
  snippetId?: string;
  fragmentId?: string;
}

export const FullCodeBlock: React.FC<FullCodeBlockProps> = ({ 
  code, 
  language = 'plaintext',
  showLineNumbers = true,
  isPublicView,
  snippetId,
  fragmentId
}) => {
  const { theme } = useTheme();
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>(
    theme === 'system' 
      ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      : theme
  );
  
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        setEffectiveTheme(mediaQuery.matches ? 'dark' : 'light');
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      setEffectiveTheme(theme);
    }
  }, [theme]);

  const isDark = effectiveTheme === 'dark';
  const isMarkdown = getLanguageLabel(language) === 'markdown';
  const [highlighterHeight, setHighlighterHeight] = useState<string>("100px");
  const containerRef = useRef<HTMLDivElement>(null);
  const LINE_HEIGHT = 19;

  useEffect(() => {
    updateHighlighterHeight();
    const resizeObserver = new ResizeObserver(updateHighlighterHeight);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => resizeObserver.disconnect();
  }, [code]);

  const updateHighlighterHeight = () => {
    if (!containerRef.current) return;
    
    const lineCount = code.split('\n').length;
    const contentHeight = (lineCount * LINE_HEIGHT) + 35;
    const newHeight = Math.min(500, Math.max(100, contentHeight));
    setHighlighterHeight(`${newHeight}px`);
  };

  const baseTheme = isDark ? vscDarkPlus : oneLight;
  const backgroundColor = isDark ? '#1E1E1E' : '#ffffff';
  const customStyle = {
    ...baseTheme,
    'pre[class*="language-"]': {
      ...baseTheme['pre[class*="language-"]'],
      margin: 0,
      fontSize: '13px',
      background: backgroundColor,
      padding: '1rem',
    },
    'code[class*="language-"]': {
      ...baseTheme['code[class*="language-"]'],
      fontSize: '13px',
      background: backgroundColor,
      display: 'block',
      textIndent: 0,
    }
  };

  return (
    <div className="relative">
      <style>
        {`
          .markdown-content-full {
            color: var(--text-color);
            background-color: ${backgroundColor};
            padding: 1rem;
            border-radius: 0.5rem;
            position: relative;
          }
          :root {
            --text-color: ${isDark ? '#ffffff' : '#000000'};
          }
        `}
      </style>
      <div className="relative">
        {isMarkdown ? (
          <div className="markdown-content markdown-content-full rounded-lg" style={{ backgroundColor }}>
            <ReactMarkdown className={`markdown prose ${isDark ? 'prose-invert' : ''} max-w-none`}>
              {code}
            </ReactMarkdown>
          </div>
        ) : (
          <div 
            ref={containerRef}
            style={{ maxHeight: '500px' }}
          >
            <SyntaxHighlighter
              language={getMonacoLanguage(language)}
              style={customStyle}
              showLineNumbers={showLineNumbers}
              wrapLines={true}
              lineProps={{
                style: { 
                  whiteSpace: 'pre',
                  wordBreak: 'break-all',
                  paddingLeft: 0
                }
              }}
              customStyle={{
                height: highlighterHeight,
                minHeight: '100px',
                marginBottom: 0,
                marginTop: 0,
                textIndent: 0,
                paddingLeft: showLineNumbers ? 10 : 20,
                borderRadius: '0.5rem',
                background: backgroundColor
              }}
            >
              {code}
            </SyntaxHighlighter>
          </div>
        )}

        <CopyButton text={code} />
        {isPublicView !== undefined && snippetId !== undefined && fragmentId !== undefined && (
          <RawButton
            isPublicView={isPublicView}
            snippetId={snippetId}
            fragmentId={fragmentId}
          />
        )}
      </div>
    </div>
  );
}