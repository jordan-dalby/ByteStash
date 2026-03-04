import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { ZoomIn, ZoomOut, Maximize, Minimize, Download, Image as ImageIcon, Copy, Check, RefreshCw, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface MermaidViewerProps {
  code: string;
}

let lastInitTheme: string | null = null;

async function loadAndInitMermaid(theme: 'light' | 'dark') {
  const { default: mermaid } = await import('mermaid');
  const mermaidTheme = theme === 'dark' ? 'dark' : 'default';
  if (lastInitTheme !== mermaidTheme) {
    mermaid.initialize({
      startOnLoad: false,
      theme: mermaidTheme,
      securityLevel: 'strict',
    });
    lastInitTheme = mermaidTheme;
  }
  return mermaid;
}

export const MermaidViewer: React.FC<MermaidViewerProps> = ({ code }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const { t } = useTranslation('components/common/markdown');
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);

  const [effectiveTheme, setEffectiveTheme] = useState<"light" | "dark">(
    theme === "system"
      ? (typeof window !== 'undefined' && window.matchMedia("(prefers-color-scheme: dark)").matches)
        ? "dark"
        : "light"
      : theme as "light" | "dark"
  );

  useEffect(() => {
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => {
        setEffectiveTheme(mediaQuery.matches ? "dark" : "light");
      };
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } else {
      setEffectiveTheme(theme as "light" | "dark");
    }
  }, [theme]);

  useEffect(() => {
    let isMounted = true;

    const renderDiagram = async () => {
      try {
        setError(null);
        const mermaid = await loadAndInitMermaid(effectiveTheme);
        const id = `mermaid-${Math.random().toString(36).substring(2, 11)}`;
        const { svg } = await mermaid.render(id, code);

        if (isMounted) {
          setSvgContent(svg);
        }
      } catch (err) {
        console.error("Failed to render mermaid diagram", err);
        if (isMounted) {
          const message = err instanceof Error ? err.message : String(err);
          setError(message || 'Error rendering diagram');
          setSvgContent('');
        }
      }
    };

    if (code) {
      renderDiagram();
    }

    return () => {
      isMounted = false;
    };
  }, [code, effectiveTheme]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch((err) => {
      console.error("Failed to copy Mermaid code to clipboard", err);
    });
  }, [code]);

  const downloadAsSVG = useCallback(() => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `diagram-${new Date().getTime()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [svgContent]);

  const downloadAsPNG = useCallback(() => {
    if (!containerRef.current || !svgContent) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error("Failed to get canvas 2D context for PNG export");
      return;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, "image/svg+xml");
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      console.error("Failed to parse SVG for PNG export", parseError.textContent);
      return;
    }
    const svgElement = doc.querySelector('svg');
    if (!svgElement) return;

    const scale = 2;

    const viewBox = svgElement.getAttribute('viewBox');
    let width = parseInt(svgElement.getAttribute('width') || '0', 10);
    let height = parseInt(svgElement.getAttribute('height') || '0', 10);

    if ((!width || !height) && viewBox) {
      const parts = viewBox.split(' ');
      width = parseFloat(parts[2]);
      height = parseFloat(parts[3]);
    }

    if (!width) width = 800;
    if (!height) height = 600;

    canvas.width = width * scale;
    canvas.height = height * scale;

    ctx.fillStyle = effectiveTheme === 'dark' ? '#1E1E1E' : '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const img = new Image();
    svgElement.setAttribute('width', (width * scale).toString());
    svgElement.setAttribute('height', (height * scale).toString());

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    img.onerror = () => {
      console.error("Failed to load SVG image for PNG conversion");
      URL.revokeObjectURL(url);
    };

    img.onload = () => {
      try {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = `diagram-${new Date().getTime()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.error("Failed to convert diagram to PNG", err);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.src = url;
  }, [svgContent, effectiveTheme]);

  if (error) {
    return (
      <div className="flex bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 border border-red-200 dark:border-red-800 rounded-lg my-4 items-start gap-3 overflow-hidden">
        <AlertTriangle className="shrink-0 mt-0.5" size={18} />
        <div className="overflow-auto text-sm font-mono whitespace-pre-wrap flex-1 min-w-0">
          <p className="font-semibold mb-1 font-sans">{t('mermaid.renderError')}</p>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative !w-full group border border-gray-300 dark:border-gray-700 rounded-lg transition-colors flex flex-col ${isFullscreen
      ? 'fixed inset-0 z-[100] bg-white dark:bg-[#0a0a0a] m-0 !border-0 !rounded-none'
      : 'my-6 bg-[#fcfcfc] dark:bg-[#121212] overflow-hidden'
      }`}>

      {svgContent && (
        <TransformWrapper
          initialScale={1}
          minScale={0.1}
          maxScale={8}
          centerOnInit={true}
          limitToBounds={false}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <React.Fragment>
              <div className="flex justify-between items-center bg-gray-100 dark:bg-[#1f1f1f] border-b border-gray-300 dark:border-gray-700 px-3 py-2 shrink-0">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 font-mono flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                  {t('mermaid.title')}
                </span>

                <div className="flex gap-1 items-center">
                  <button onClick={() => zoomIn()} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300 transition-colors cursor-pointer" title={t('mermaid.zoomIn')}><ZoomIn size={14} /></button>
                  <button onClick={() => zoomOut()} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300 transition-colors cursor-pointer" title={t('mermaid.zoomOut')}><ZoomOut size={14} /></button>
                  <button onClick={() => resetTransform()} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300 transition-colors cursor-pointer" title={t('mermaid.resetView')}><RefreshCw size={14} /></button>
                  <div className="w-px h-4 my-auto bg-gray-300 dark:bg-gray-600 mx-1"></div>
                  <button onClick={copyCode} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300 transition-colors cursor-pointer" title={t('mermaid.copyCode')}>{copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}</button>
                  <button onClick={downloadAsSVG} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300 transition-colors cursor-pointer" title={t('mermaid.downloadSVG')}><Download size={14} /></button>
                  <button onClick={downloadAsPNG} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300 transition-colors cursor-pointer" title={t('mermaid.downloadPNG')}><ImageIcon size={14} /></button>
                  <div className="w-px h-4 my-auto bg-gray-300 dark:bg-gray-600 mx-1"></div>
                  <button onClick={() => { setIsFullscreen(!isFullscreen); setTimeout(resetTransform, 50); }} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300 transition-colors cursor-pointer" title={isFullscreen ? t('mermaid.exitFullscreen') : t('mermaid.fullscreen')}>
                    {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
                  </button>
                </div>
              </div>

              <TransformComponent
                wrapperClass={`!w-full ${isFullscreen ? 'h-[calc(100vh-45px)] flex-1' : 'min-h-[250px] h-auto p-4 border-x border-b border-gray-300 dark:border-gray-700 rounded-b-lg'} flex items-center justify-center cursor-grab active:cursor-grabbing`}
                contentClass="!w-full h-full flex items-center justify-center p-4"
              >
                <div
                  ref={containerRef}
                  className={`flex justify-center items-center !w-full h-full mermaid-container ${isFullscreen ? 'mermaid-fullscreen' : ''}`}
                  dangerouslySetInnerHTML={{ __html: svgContent }}
                />
              </TransformComponent>
            </React.Fragment>
          )}
        </TransformWrapper>
      )}
    </div>
  );
};

export default MermaidViewer;
