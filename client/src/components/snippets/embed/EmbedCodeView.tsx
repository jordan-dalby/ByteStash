import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  vscDarkPlus,
  oneLight,
} from "react-syntax-highlighter/dist/cjs/styles/prism";
import {
  getLanguageLabel,
  getMonacoLanguage,
} from "../../../utils/language/languageUtils";
import EmbedCopyButton from "./EmbedCopyButton";
import Admonition from "../../utils/Admonition";
import { flattenToText } from "../../../utils/markdownUtils";

export interface EmbedCodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  theme?: "light" | "dark" | "blue" | "system";
}

export const EmbedCodeView: React.FC<EmbedCodeBlockProps> = ({
  code,
  language = "plaintext",
  showLineNumbers = true,
  theme = "system",
}) => {
  const [effectiveTheme, setEffectiveTheme] = useState<
    "light" | "dark" | "blue"
  >(() => {
    if (theme === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return theme;
  });

  useEffect(() => {
    if (theme !== "system") {
      setEffectiveTheme(theme);
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      setEffectiveTheme(mediaQuery.matches ? "dark" : "light");
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const isDark = effectiveTheme === "dark" || effectiveTheme === "blue";
  const isMarkdown = getLanguageLabel(language) === "markdown";
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

    const lineCount = code.split("\n").length;
    const contentHeight = lineCount * LINE_HEIGHT + 35;
    const newHeight = Math.min(500, Math.max(100, contentHeight));
    setHighlighterHeight(`${newHeight}px`);
  };

  const baseTheme = isDark ? vscDarkPlus : oneLight;
  const getBackgroundColor = () => {
    switch (effectiveTheme) {
      case "blue":
      case "dark":
        return "#1E1E1E";
      case "light":
        return "#ffffff";
    }
  };

  const backgroundColor = getBackgroundColor();
  const customStyle = {
    ...baseTheme,
    'pre[class*="language-"]': {
      ...baseTheme['pre[class*="language-"]'],
      margin: 0,
      fontSize: "13px",
      background: backgroundColor,
      padding: "1rem",
    },
    'code[class*="language-"]': {
      ...baseTheme['code[class*="language-"]'],
      fontSize: "13px",
      background: backgroundColor,
      display: "block",
      textIndent: 0,
    },
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
          .markdown-content-full pre,
          .markdown-content-full code {
            background-color: ${isDark ? "#2d2d2d" : "#ebebeb"} !important;
            color: ${isDark ? "#e5e7eb" : "#1f2937"} !important;
          }
          .markdown-content-full pre code {
            background-color: transparent !important;
            padding: 0;
            border: none;
            box-shadow: none;
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
            <ReactMarkdown
              className={`markdown prose ${
                isDark ? "prose-invert" : ""
              } max-w-none`}
              components={{
                blockquote: ({ children }) => {
                  const text = flattenToText(children).trim();
                  const match = text.match(
                    /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*([\s\S]*)$/
                  );
                  if (match) {
                    return (
                      <Admonition type={match[1]}>{match[2].trim()}</Admonition>
                    );
                  }
                  return <blockquote>{children}</blockquote>;
                },
                p: ({ children }) => {
                  const text = flattenToText(children).trim();
                  const match = text.match(
                    /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*([\s\S]*)$/
                  );
                  if (match) {
                    return (
                      <Admonition type={match[1]}>{match[2].trim()}</Admonition>
                    );
                  }
                  return <p>{children}</p>;
                },
              }}
            >
              {code}
            </ReactMarkdown>
          </div>
        ) : (
          <div ref={containerRef} style={{ maxHeight: "500px" }}>
            <SyntaxHighlighter
              language={getMonacoLanguage(language)}
              style={customStyle}
              showLineNumbers={showLineNumbers}
              wrapLines={true}
              lineProps={{
                style: {
                  whiteSpace: "pre",
                  wordBreak: "break-all",
                  paddingLeft: 0,
                },
              }}
              customStyle={{
                height: highlighterHeight,
                minHeight: "100px",
                marginBottom: 0,
                marginTop: 0,
                textIndent: 0,
                paddingLeft: showLineNumbers ? 10 : 20,
                borderRadius: "0.5rem",
                background: backgroundColor,
              }}
            >
              {code}
            </SyntaxHighlighter>
          </div>
        )}

        <EmbedCopyButton text={code} theme={theme} />
      </div>
    </div>
  );
};
