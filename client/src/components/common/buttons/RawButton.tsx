import React, { useState } from 'react';
import { Check, Code } from 'lucide-react';

export interface RawButtonProps {
  isPublicView: boolean;
  snippetId: string;
  fragmentId: string;
}

const RawButton: React.FC<RawButtonProps> = ({ isPublicView, snippetId, fragmentId }) => {
  const [isOpenRaw, setIsOpenRaw] = useState(false);

  const handleOpenRaw = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (isPublicView) {
        window.open(`/api/public/snippets/${snippetId}/${fragmentId}/raw`, '_blank');
      } else {
        window.open(`/api/snippets/${snippetId}/${fragmentId}/raw`, '_blank');
      }
    } catch (err) {
      console.error('Failed to open raw: ', err);
    }
      
    setIsOpenRaw(true);
    setTimeout(() => setIsOpenRaw(false), 2000);
  };

  return (
    <button
      onClick={handleOpenRaw}
      className="absolute top-2 right-10 p-1 bg-light-surface dark:bg-dark-surface rounded-md 
        hover:bg-light-hover dark:hover:bg-dark-hover transition-colors text-light-text dark:text-dark-text"
      title="Open Raw"
    >
      {isOpenRaw ? (
        <Check size={16} className="text-light-primary dark:text-dark-primary" />
      ) : (
        <Code size={16} className="text-light-text dark:text-dark-text" />
      )}
    </button>
  );
};

export default RawButton;