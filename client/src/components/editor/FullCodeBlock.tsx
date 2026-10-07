import React, { useEffect, useRef, useState } from "react";
import MarkdownRenderer from "../common/markdown/MarkdownRenderer";
import Editor, { OnMount } from "@monaco-editor/react";
import {
  getLanguageLabel,
  getMonacoLanguage,
  isPlaintextLanguage,
} from "../../utils/language/languageUtils";
import CopyButton from "../common/buttons/CopyButton";
import { useTheme } from "../../contexts/ThemeContext";
import RawButton from "../common/buttons/RawButton";
import ExportImageButton from "./export/ExportImageButton";
import ExportImageModal from "./export/ExportImageModal";

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
  language = "plaintext",
  showLineNumbers = true,
  isPublicView,
  snippetId,
  fragmentId,
}) => {
  const { theme } = useTheme();
  const [effectiveTheme, setEffectiveTheme] = useState<"light" | "dark">(
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme
  );
  
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  useEffect(() => {
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => {
        setEffectiveTheme(mediaQuery.matches ? "dark" : "light");
      };
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } else {
      setEffectiveTheme(theme);
    }
  }, [theme]);

  const isDark = effectiveTheme === "dark";
  const isMarkdown = getLanguageLabel(language) === "markdown";
  const isPlaintext = isPlaintextLanguage(language);
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
  }, [code, isPlaintext]);

  const updateHighlighterHeight = () => {
    if (!containerRef.current || isPlaintext) return;

    const lineCount = code.split("\n").length;
    const contentHeight = lineCount * LINE_HEIGHT + 35;
    const newHeight = Math.min(500, Math.max(100, contentHeight));
    setHighlighterHeight(`${newHeight}px`);
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    const updateWrappedHeight = () => {
      if (editor.getOption(monaco.editor.EditorOption.wordWrap) !== "on") return;
      const newHeight = Math.min(500, Math.max(100, editor.getContentHeight()));
      setHighlighterHeight(`${newHeight}px`);
    };
    editor.onDidContentSizeChange(updateWrappedHeight);
    updateWrappedHeight();
  };

  const backgroundColor = isDark ? "#1E1E1E" : "#ffffff";

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
            --text-color: ${isDark ? "#ffffff" : "#000000"};
          }
        `}
      </style>
      <div className="relative">
        {isMarkdown ? (
          <div
            className="rounded-lg markdown-content markdown-content-full"
            style={{ backgroundColor }}
          >
            <MarkdownRenderer
              className={`markdown prose ${isDark ? "prose-invert" : ""
                } max-w-none`}
            >
              {code}
            </MarkdownRenderer>
          </div>
        ) : (
          <div ref={containerRef} style={{ 
            maxHeight: "500px", 
            borderRadius: "0.5rem", 
            overflow: "hidden", 
            background: backgroundColor,
            border: isDark ? '1px solid #333' : '1px solid #e5e7eb'
          }}>
            <Editor
              height={highlighterHeight}
              language={getMonacoLanguage(language)}
              theme={isDark ? "vs-dark" : "light"}
              value={code}
              onMount={handleEditorDidMount}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: isPlaintext ? "on" : "off",
                padding: { top: 16, bottom: 16 },
                lineNumbers: showLineNumbers ? "on" : "off",
                renderLineHighlight: "none",
                scrollbar: {
                  vertical: "visible",
                  horizontal: "visible"
                }
              }}
            />
          </div>
        )}

        <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
          <CopyButton text={code} />
          <ExportImageButton onClick={() => setIsExportModalOpen(true)} />
          {isPublicView !== undefined &&
            snippetId !== undefined &&
            fragmentId !== undefined && (
              <RawButton
                isPublicView={isPublicView}
                snippetId={snippetId}
                fragmentId={fragmentId}
              />
            )}
        </div>
      </div>

      <ExportImageModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        code={code}
        language={language}
      />
    </div>
  );
};
