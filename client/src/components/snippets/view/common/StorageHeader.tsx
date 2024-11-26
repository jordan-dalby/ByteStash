import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_VERSION } from '../../../../constants/settings';
import ViewSwitch from './ViewSwitch';
import { ROUTES } from '../../../../constants/routes';

interface StorageHeaderProps {
  isPublicView: boolean;
}

const StorageHeader: React.FC<StorageHeaderProps> = ({ isPublicView }) => {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const navigate = useNavigate();

  const tooltipText = isPublicView 
    ? "You're viewing publicly shared snippets. These snippets are read-only and visible to everyone."
    : "You're viewing your private snippets. Only you can see and modify these snippets.";

  const handleViewToggle = (checked: boolean) => {
    navigate(checked ? ROUTES.PUBLIC_SNIPPETS : ROUTES.HOME);
  };

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-4xl font-bold text-light-text dark:text-dark-text flex items-baseline gap-2">
        <img src="/logo512.png" alt="ByteStash Logo" className="w-7 h-7" />
        ByteStash
        <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">v{APP_VERSION}</span>
      </h1>
      
      <div 
        className="relative inline-block"
        onMouseEnter={() => setIsTooltipVisible(true)}
        onMouseLeave={() => setIsTooltipVisible(false)}
      >
        <ViewSwitch checked={isPublicView} onChange={handleViewToggle} />
        
        {isTooltipVisible && (
          <div 
            className="absolute left-1/2 top-full mt-3 w-64 -translate-x-1/2 rounded-lg border border-light-border 
              dark:border-dark-border bg-light-surface dark:bg-dark-surface p-3 text-sm z-50 shadow-lg
              text-light-text dark:text-dark-text before:content-[''] before:absolute before:-top-2 before:left-1/2 
              before:-translate-x-1/2 before:border-8 before:border-transparent before:border-b-light-surface 
              dark:before:border-b-dark-surface"
            role="tooltip"
          >
            {tooltipText}
          </div>
        )}
      </div>
    </div>
  );
};

export default StorageHeader;
