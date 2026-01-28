import React, { useEffect, useState, useRef } from 'react';
import { FileCode } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Snippet } from '../../../types/snippets';
import { getLanguageLabel } from '../../../utils/language/languageUtils';
import { basePath } from '../../../utils/api/basePath';
import { generateEmbedId } from '../../../utils/helpers/embedUtils';
import { EmbedCodeView } from './EmbedCodeView';

interface EmbedViewProps {
  shareId: string;
  showTitle?: boolean;
  showDescription?: boolean;
  showFileHeaders?: boolean;
  showPoweredBy?: boolean;
  theme?: 'light' | 'dark' | 'blue' | 'system';
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
  const { t: translateDefault } = useTranslation();
  const { t: translate } = useTranslation('components/snippets/embed');
  const [snippet, setSnippet] = useState<Snippet | null>(null);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark' | 'blue'>(() => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  });

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
    if (theme !== 'system') {
      setEffectiveTheme(theme);
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      setEffectiveTheme(mediaQuery.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
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
            theme: theme,
            ...(fragmentIndex !== undefined && { fragmentIndex: fragmentIndex.toString() })
          })
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || translate('embedView.error.default'));
        }

        const data = await response.json();
        setSnippet(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : translate('embedView.error.default'));
      }
    };

    fetchSnippet();
  }, [shareId, showTitle, showDescription, showFileHeaders, showPoweredBy, theme, fragmentIndex]);

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
      <div ref={containerRef} className={`theme-${theme} flex items-center justify-center p-4`}>
        <div className="text-center">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!snippet) {
    return (
      <div ref={containerRef} className={`theme-${theme} flex items-center justify-center p-4`}>
        <div className="text-center">
          <p className={effectiveTheme === 'light' ? "text-light-text" : "text-dark-text"}>{translateDefault('loading')}</p>
        </div>
      </div>
    );
  }

  const getBackgroundColor = () => {
    switch (effectiveTheme) {
      case 'blue':
        return 'bg-dark-surface';
      case 'dark':
        return 'bg-neutral-800';
      case 'light':
        return 'bg-light-surface';
    }
  };

  const getHoverColor = () => {
    switch (effectiveTheme) {
      case 'blue':
        return 'bg-dark-hover/50';
      case 'dark':
        return 'bg-neutral-700/50';
      case 'light':
        return 'bg-light-hover/50';
    }
  };

  const getTextColor = () => {
    if (effectiveTheme === 'light') {
      return 'text-light-text';
    }
    return 'text-dark-text';
  };

  return (
    <div ref={containerRef} className={`theme-${theme} max-w-5xl mx-auto p-0`}>
      <div className={`${getBackgroundColor()} rounded-lg overflow-hidden`}>
        <div className="p-4">
          {(showTitle || showDescription) && (
            <div className="mb-4">
              {showTitle && snippet.title && (
                <h1 className={`text-xl font-bold mb-2 ${getTextColor()}`}>
                  {snippet.title}
                </h1>
              )}
              {showDescription && snippet.description && (
                <p className={`text-sm ${getTextColor()}`}>
                  {snippet.description}
                </p>
              )}
            </div>
          )}

          <div className="space-y-4">
            {snippet.fragments.map((fragment, index) => (
              <div key={index}>
                {showFileHeaders && (
                  <div className={`flex items-center justify-between text-xs mb-1 h-7 px-3 rounded ${getHoverColor()}`}>
                    <div className="flex items-center gap-1 min-w-0 flex-1">
                      <FileCode 
                        size={12} 
                        className={`${getTextColor()} shrink-0`} 
                      />
                      <span className={`truncate ${getTextColor()}`}>{fragment.file_name}</span>
                    </div>
                    <span className="ml-2">
                      {getLanguageLabel(fragment.language)}
                    </span>
                  </div>
                )}

                <EmbedCodeView
                  code={fragment.code}
                  language={fragment.language}
                  showLineNumbers={true}
                  theme={theme}
                />
              </div>
            ))}
          </div>

          {showPoweredBy && (
            <div className="mt-2 text-right">
              <span className={`text-xs ${getTextColor()}`}>
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
