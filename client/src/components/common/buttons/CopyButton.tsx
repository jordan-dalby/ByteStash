import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface CopyButtonProps {
  text: string;
}

const CopyButton: React.FC<CopyButtonProps> = ({ text }) => {
  const { t: translate } = useTranslation('components/common/buttons');
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
        } finally {
          textArea.remove();
        }
      }
      
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 p-1 bg-light-surface dark:bg-dark-surface rounded-md 
        hover:bg-light-hover dark:hover:bg-dark-hover transition-colors text-light-text dark:text-dark-text"
      title={translate('copyButton.title')}
    >
      {isCopied ? (
        <Check size={16} className="text-light-primary dark:text-dark-primary" />
      ) : (
        <Copy size={16} className="text-light-text dark:text-dark-text" />
      )}
    </button>
  );
};

export default CopyButton;