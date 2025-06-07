import React from 'react';
import { Lock, LockOpen } from 'lucide-react';

export interface LockToggleButtonProps {
  isLocked: boolean;
  onToggle: (e?: React.MouseEvent) => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'button' | 'badge';
  disabled?: boolean;
  showTooltip?: boolean;
  className?: string;
}

export const LockToggleButton: React.FC<LockToggleButtonProps> = ({
  isLocked,
  onToggle,
  size = 'md',
  variant = 'icon',
  disabled = false,
  showTooltip = true,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5', 
    lg: 'w-6 h-6'
  };

  const buttonSizeClasses = {
    sm: 'p-1',
    md: 'p-1.5',
    lg: 'p-2'
  };

  const getIcon = () => {
    const iconClass = sizeClasses[size];
    
    if (isLocked) {
      return <Lock className={`${iconClass} text-red-600`} />;
    } else {
      return <LockOpen className={`${iconClass} text-gray-400`} />;
    }
  };

  const getTooltip = () => {
    if (isLocked) {
      return 'Snippet is locked - protected from accidental deletion. Click to unlock.';
    } else {
      return 'Snippet is unlocked. Click to lock and protect from accidental deletion.';
    }
  };

  if (variant === 'badge') {
    return isLocked ? (
      <button
        onClick={onToggle}
        disabled={disabled}
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200 transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
        title={showTooltip ? getTooltip() : undefined}
      >
        <Lock className="w-3 h-3 mr-1" />
        Protected
      </button>
    ) : null;
  }

  if (variant === 'button') {
    return (
      <button
        onClick={onToggle}
        disabled={disabled}
        className={`
          inline-flex items-center px-3 py-1.5 border rounded-md text-sm font-medium
          transition-colors duration-200
          ${isLocked 
            ? 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100' 
            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
          ${className}
        `}
        title={showTooltip ? getTooltip() : undefined}
      >
        {getIcon()}
        <span className="ml-2">
          {isLocked ? 'Locked' : 'Unlocked'}
        </span>
      </button>
    );
  }

  // Default: icon variant
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`
        ${buttonSizeClasses[size]}
        rounded transition-colors duration-200
        ${isLocked 
          ? 'hover:bg-red-100 text-red-600' 
          : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        ${className}
      `}
      title={showTooltip ? getTooltip() : undefined}
      aria-label={isLocked ? 'Unlock snippet' : 'Lock snippet'}
    >
      {getIcon()}
    </button>
  );
}; 