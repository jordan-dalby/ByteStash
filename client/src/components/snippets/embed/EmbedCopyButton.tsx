import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface EmbedCopyButtonProps {
  text: string;
  theme: 'light' | 'dark' | 'blue' | 'system';
}

const EmbedCopyButton: React.FC<EmbedCopyButtonProps> = ({ text, theme }) => {
  const { t: translate } = useTranslation('components/snippets/embed');
  const [isCopied, setIsCopied] = useState(false);
  
  const isDark = theme === 'dark' || theme === 'blue' || 
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
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
      
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      setIsCopied(false);
    }
  };

  const getBackgroundColor = () => {
    switch (theme) {
      case 'blue':
        return 'bg-dark-surface hover:bg-dark-hover';
      case 'dark':
        return 'bg-neutral-700 hover:bg-neutral-600';
      case 'light':
        return 'bg-light-surface hover:bg-light-hover';
      case 'system':
        return isDark 
          ? 'bg-neutral-700 hover:bg-neutral-600' 
          : 'bg-light-surface hover:bg-light-hover';
    }
  };

  const getTextColor = () => {
    if (theme === 'blue' || theme === 'dark' || (theme === 'system' && isDark)) {
      return 'text-dark-text';
    }
    return 'text-light-text';
  };

  const getIconColor = () => {
    if (isCopied) {
      return isDark ? 'text-dark-primary' : 'text-light-primary';
    }
    if (theme === 'blue' || theme === 'dark' || (theme === 'system' && isDark)) {
      return 'text-dark-text';
    }
    return 'text-light-text';
  };

  return (
    <button
      onClick={handleCopy}
      className={`absolute top-2 right-2 p-1 rounded-md transition-colors ${getBackgroundColor()} ${getTextColor()}`}
      title={translate('embedCopyButton.title')}
    >
      {isCopied ? (
        <Check size={16} className={getIconColor()} />
      ) : (
        <Copy size={16} className={getIconColor()} />
      )}
    </button>
  );
};

export default EmbedCopyButton;
