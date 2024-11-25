import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, oneLight } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { getLanguageLabel, getMonacoLanguage } from '../../utils/language/languageUtils';
import CopyButton from '../common/buttons/CopyButton';
import { useTheme } from '../../contexts/ThemeContext';

interface PreviewCodeBlockProps {
  code: string;
  language?: string;
  previewLines?: number;
  showLineNumbers?: boolean;
}

export const PreviewCodeBlock: React.FC<PreviewCodeBlockProps> = ({
  code,
  language = 'plaintext',
  previewLines = 4,
  showLineNumbers = true
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
  const LINE_HEIGHT = 19;
  const visibleHeight = (previewLines + 2) * LINE_HEIGHT;

  const truncatedCode = code.split('\n').slice(0, previewLines + 5).join('\n');

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
    <div className="relative select-none" style={{ height: visibleHeight }}>
      <style>
        {`
          .markdown-content-preview {
            color: var(--text-color);
            background-color: ${backgroundColor};
            padding: 1rem;
            border-radius: 0.5rem;
            position: relative;
            max-height: ${visibleHeight}px;
            overflow: hidden;
          }
          .token-line:nth-child(n+${previewLines + 1}) {
            visibility: hidden;
          }
          .react-syntax-highlighter-line-number:nth-child(n+${previewLines + 1}) {
            visibility: hidden;
          }
          :root {
            --text-color: ${isDark ? '#ffffff' : '#000000'};
          }
        `}
      </style>

      <div className="relative">
        {isMarkdown ? (
          <div className="markdown-content markdown-content-preview rounded-lg overflow-hidden" style={{ backgroundColor }}>
            <ReactMarkdown className={`markdown prose ${isDark ? 'prose-invert' : ''} max-w-none`}>
              {truncatedCode}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="preview-wrapper">
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
                maxHeight: visibleHeight,
                minHeight: visibleHeight,
                marginBottom: 0,
                marginTop: 0,
                textIndent: 0,
                paddingLeft: showLineNumbers ? 10 : 20,
                borderRadius: '0.5rem',
                overflow: 'hidden',
                background: backgroundColor,
              }}
            >
              {truncatedCode}
            </SyntaxHighlighter>
          </div>
        )}

        <div 
          className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-light-surface dark:from-dark-surface to-transparent pointer-events-none rounded-b-lg"
          style={{ height: `${LINE_HEIGHT * 2}px` }}
        />

        <CopyButton text={code} />
      </div>
    </div>
  );
}
