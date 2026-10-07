import React, { useEffect, useState } from "react";
import MarkdownRenderer from "../common/markdown/MarkdownRenderer";
import Editor from "@monaco-editor/react";
import {
  getLanguageLabel,
  getMonacoLanguage,
  isPlaintextLanguage,
} from "../../utils/language/languageUtils";
import CopyButton from "../common/buttons/CopyButton";
import { useTheme } from "../../contexts/ThemeContext";
import RawButton from "../common/buttons/RawButton";

interface PreviewCodeBlockProps {
  code: string;
  language?: string;
  previewLines?: number;
  showLineNumbers?: boolean;
  isPublicView?: boolean;
  isRecycleView?: boolean;
  snippetId?: string;
  fragmentId?: string;
}

export const PreviewCodeBlock: React.FC<PreviewCodeBlockProps> = ({
  code,
  language = "plaintext",
  previewLines = 4,
  showLineNumbers = true,
  isPublicView,
  isRecycleView,
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

  useEffect(() => {
    const updateEffectiveTheme = () => {
      if (theme === "system") {
        setEffectiveTheme(
          window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light"
        );
      } else {
        setEffectiveTheme(theme);
      }
    };

    updateEffectiveTheme();

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      mediaQuery.addEventListener("change", updateEffectiveTheme);
      return () =>
        mediaQuery.removeEventListener("change", updateEffectiveTheme);
    }
  }, [theme]);

  const isDark = effectiveTheme === "dark";
  const isMarkdown = getLanguageLabel(language) === "markdown";
  const LINE_HEIGHT = 19;
  const visibleHeight = (previewLines + 2) * LINE_HEIGHT;

  const truncatedCode = code
    .split("\n")
    .slice(0, previewLines + 5)
    .join("\n");

  const backgroundColor = isDark ? "#1E1E1E" : "#ffffff";

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
          .react-syntax-highlighter-line-number:nth-child(n+${previewLines + 1
          }) {
            visibility: hidden;
          }
          :root {
            --text-color: ${isDark ? "#ffffff" : "#000000"};
          }
        `}
      </style>

      <div className="relative">
        {isMarkdown ? (
          <div
            className="overflow-hidden rounded-lg markdown-content markdown-content-preview"
            style={{ backgroundColor }}
          >
            <MarkdownRenderer
              className={`markdown prose ${isDark ? "prose-invert" : ""
                } max-w-none`}
              disableMermaid
            >
              {truncatedCode}
            </MarkdownRenderer>
          </div>
        ) : (
          <div className="preview-wrapper" style={{ 
            height: visibleHeight, 
            borderRadius: "0.5rem", 
            overflow: "hidden", 
            background: backgroundColor,
            border: isDark ? '1px solid #333' : '1px solid #e5e7eb'
          }}>
            <Editor
              height={visibleHeight}
              language={getMonacoLanguage(language)}
              theme={isDark ? "vs-dark" : "light"}
              value={truncatedCode}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: isPlaintextLanguage(language) ? "on" : "off",
                padding: { top: 16, bottom: 16 },
                lineNumbers: showLineNumbers ? "on" : "off",
                renderLineHighlight: "none",
                scrollbar: {
                  vertical: "hidden",
                  horizontal: "visible"
                }
              }}
            />
          </div>
        )}

        <div
          className="absolute inset-x-0 bottom-0 rounded-b-lg pointer-events-none bg-gradient-to-t to-transparent"
          style={{
            height: `${LINE_HEIGHT * 2}px`,
            background: `linear-gradient(to top, ${backgroundColor}, transparent)`,
          }}
        />

        <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
          <CopyButton text={code} />
          {!isRecycleView &&
            isPublicView !== undefined &&
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
    </div>
  );
};
