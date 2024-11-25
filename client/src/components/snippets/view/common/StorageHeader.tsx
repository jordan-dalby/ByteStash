import React, { useState } from 'react';
import { Globe, Lock } from 'lucide-react';
import { APP_VERSION } from '../../../../constants/settings';

interface StorageHeaderProps {
  isPublicView: boolean;
}

const StorageHeader: React.FC<StorageHeaderProps> = ({ isPublicView }) => {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  const tooltipText = isPublicView 
    ? "You're viewing publicly shared snippets. These snippets are read-only and visible to everyone."
    : "You're viewing your private snippets. Only you can see and modify these snippets.";

  return (
    <div>
      <h1 className="text-4xl font-bold text-light-text dark:text-dark-text flex items-baseline gap-2">
        ByteStash
        <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">v{APP_VERSION}</span>
      </h1>
      <div 
        className="relative mt-1"
        onMouseEnter={() => setIsTooltipVisible(true)}
        onMouseLeave={() => setIsTooltipVisible(false)}
      >
        <div className="flex items-center gap-1.5">
          {isPublicView ? (
            <Globe className="w-3.5 h-3.5 text-light-primary dark:text-dark-primary" aria-label="Public View" />
          ) : (
            <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" aria-label="Private View" />
          )}
          <span className={`text-sm ${
            isPublicView 
              ? 'text-light-primary dark:text-dark-primary' 
              : 'text-emerald-600 dark:text-emerald-400'
          }`}>
            {isPublicView ? 'Viewing public snippets' : 'Viewing private snippets'}
          </span>
        </div>
        
        {isTooltipVisible && (
          <div 
            className={`absolute left-0 top-full mt-2 w-64 rounded-lg border p-3 text-sm z-50 shadow-lg ${
              isPublicView 
                ? 'border-light-primary/20 dark:border-dark-primary/20 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200' 
                : 'border-emerald-600/20 dark:border-emerald-400/20 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200'
            }`}
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