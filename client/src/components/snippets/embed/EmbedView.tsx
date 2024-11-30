import React, { useEffect, useState, useRef } from 'react';
import { FileCode } from 'lucide-react';
import { Snippet } from '../../../types/snippets';
import { getLanguageLabel } from '../../../utils/language/languageUtils';
import { FullCodeBlock } from '../../editor/FullCodeBlock';
import { basePath } from '../../../utils/api/basePath';
import { generateEmbedId } from '../../../utils/helpers/embedUtils';

interface EmbedViewProps {
  shareId: string;
  showTitle?: boolean;
  showDescription?: boolean;
  showFileHeaders?: boolean;
  showPoweredBy?: boolean;
  theme?: 'light' | 'dark' | 'system';
  fragmentIndex?: number;
}

export const EmbedView: React.FC<EmbedViewProps> = ({
  shareId,
  showTitle = false,
  showDescription = false,
  showFileHeaders = true,
  showPoweredBy = true,
  theme = 'system',
  fragmentIndex
}) => {
  const [snippet, setSnippet] = useState<Snippet | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTheme, setActiveTheme] = useState<'light' | 'dark'>(theme === 'system' ? 'light' : theme);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDark = activeTheme === 'dark';

  const embedId = generateEmbedId({
    shareId,
    showTitle,
    showDescription,
    showFileHeaders,
    showPoweredBy,
    theme,
    fragmentIndex
  });

  useEffect(() => {
    const updateTheme = (isDark: boolean) => {
      const newTheme = isDark ? 'dark' : 'light';
      setActiveTheme(newTheme);
    };

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
        updateTheme(e.matches);
      };

      handleChange(mediaQuery);
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      updateTheme(theme === 'dark');
    }
  }, [theme]);

  useEffect(() => {
    const fetchSnippet = async () => {
      try {
        const response = await fetch(
          `${basePath}/api/embed/${shareId}?` + 
          new URLSearchParams({
            showTitle: showTitle.toString(),
            showDescription: showDescription.toString(),
            showFileHeaders: showFileHeaders.toString(),
            showPoweredBy: showPoweredBy.toString(),
            theme: activeTheme,
            ...(fragmentIndex !== undefined && { fragmentIndex: fragmentIndex.toString() })
          })
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to load snippet');
        }

        const data = await response.json();
        setSnippet(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load snippet');
      }
    };

    fetchSnippet();
  }, [shareId, showTitle, showDescription, showFileHeaders, showPoweredBy, activeTheme, fragmentIndex]);

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const height = containerRef.current.offsetHeight;
        window.parent.postMessage({ type: 'resize', height, embedId }, '*');
      }
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [snippet, embedId]);

  if (error) {
    return (
      <div ref={containerRef} className={`theme-${activeTheme} flex items-center justify-center p-4`}>
        <div className="text-center">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!snippet) {
    return (
      <div ref={containerRef} className={`theme-${activeTheme} flex items-center justify-center p-4`}>
        <div className="text-center">
          <p className={isDark ? "text-dark-text" : "text-light-text"}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`theme-${activeTheme} max-w-5xl mx-auto p-0`}>
      <div className={`${isDark ? "bg-dark-surface" : "bg-light-surface"} rounded-lg overflow-hidden`}>
        <div className="p-4">
          {(showTitle || showDescription) && (
            <div className="mb-4">
              {showTitle && snippet.title && (
                <h1 className={`text-xl font-bold mb-2 ${isDark ? "text-dark-text" : "text-light-text"}`}>
                  {snippet.title}
                </h1>
              )}
              {showDescription && snippet.description && (
                <p className={`text-sm ${isDark ? "text-dark-text" : "text-light-text"}`}>
                  {snippet.description}
                </p>
              )}
            </div>
          )}

          <div className="space-y-4">
            {snippet.fragments.map((fragment, index) => (
              <div key={index}>
                {showFileHeaders && (
                  <div className={`flex items-center justify-between text-xs mb-1 h-7 px-3 rounded ${
                    isDark ? "text-dark-text-secondary bg-dark-hover/50" : "text-light-text-secondary bg-light-hover/50"
                  }`}>
                    <div className="flex items-center gap-1 min-w-0 flex-1">
                      <FileCode 
                        size={12} 
                        className={`${isDark ? "text-dark-text-secondary" : "text-light-text-secondary"} shrink-0`} 
                      />
                      <span className="truncate">{fragment.file_name}</span>
                    </div>
                    <span className="ml-2">
                      {getLanguageLabel(fragment.language)}
                    </span>
                  </div>
                )}

                <FullCodeBlock
                  code={fragment.code}
                  language={fragment.language}
                  showLineNumbers={true}
                  forceTheme={isDark ? 'dark' : 'light'}
                />
              </div>
            ))}
          </div>

          {showPoweredBy && (
            <div className="mt-2 text-right">
              <span className={`text-xs ${isDark ? "text-dark-text-secondary" : "text-light-text-secondary"}`}>
                Powered by ByteStash
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmbedView;
