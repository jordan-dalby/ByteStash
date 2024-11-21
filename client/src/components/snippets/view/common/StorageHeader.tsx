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
    <h1 className="text-4xl font-bold text-gray-100 flex items-baseline gap-2">
      ByteStash
      <span className="text-sm text-gray-400">v{APP_VERSION}</span>
    </h1>
    <div 
      className="relative mt-1"
      onMouseEnter={() => setIsTooltipVisible(true)}
      onMouseLeave={() => setIsTooltipVisible(false)}
    >
      <div className="flex items-center gap-1.5">
        {isPublicView ? (
          <Globe className="w-3.5 h-3.5 text-blue-300" aria-label="Public View" />
        ) : (
          <Lock className="w-3.5 h-3.5 text-green-300" aria-label="Private View" />
        )}
        <span className={`text-sm ${
          isPublicView 
            ? 'text-blue-300' 
            : 'text-green-300'
        }`}>
          {isPublicView ? 'Viewing public snippets' : 'Viewing private snippets'}
        </span>
      </div>
      
      {isTooltipVisible && (
        <div 
          className={`absolute left-0 top-full mt-2 w-64 rounded-lg border p-3 text-sm z-50 shadow-lg ${
            isPublicView 
              ? 'border-blue-800 bg-blue-950/95 text-blue-200' 
              : 'border-green-800 bg-green-950/95 text-green-200'
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