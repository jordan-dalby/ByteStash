import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';

export interface CopyButtonProps {
  text: string;
  forceTheme?: 'light' | 'dark' | null;
}

const CopyButton: React.FC<CopyButtonProps> = ({ text, forceTheme = null }) => {
  const [isCopied, setIsCopied] = useState(false);
  const { theme } = useTheme();
  const isDark = forceTheme ? forceTheme == 'dark' : theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const isEmbedded = window !== window.parent;
      
      if (isEmbedded || !navigator.clipboard || !window.isSecureContext) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          const successful = document.execCommand('copy');
          if (!successful) {
            throw new Error('Copy command failed');
          }
        } finally {
          textArea.remove();
        }
      } else {
        await navigator.clipboard.writeText(text);
      }
      
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      setIsCopied(false);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`absolute top-2 right-2 p-1 rounded-md transition-colors ${
        isDark 
          ? `bg-dark-surface hover:bg-dark-hover text-dark-text` 
          : `bg-light-surface hover:bg-light-hover text-light-text`
      }`}
      title="Copy to clipboard"
    >
      {isCopied ? (
        <Check size={16} className={isDark ? "text-dark-primary" : "text-light-primary"} />
      ) : (
        <Copy size={16} className={isDark ? "text-dark-text" : "text-light-text"} />
      )}
    </button>
  );
};

export default CopyButton;
