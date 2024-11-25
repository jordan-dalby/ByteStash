import React, { forwardRef } from 'react';

export interface IconButtonProps {
  icon: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  label?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'action' | 'custom';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  showLabel?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(({
  icon,
  onClick,
  label,
  variant = 'secondary',
  size = 'md',
  disabled = false,
  className = '',
  type = 'button',
  showLabel = false
}, ref) => {
  const baseClasses = 'flex items-center justify-center gap-2 rounded-md transition-colors';
  const variantClasses = {
    primary: 'bg-light-hover dark:bg-dark-hover hover:bg-light-hover dark:hover:bg-dark-hover text-light-text dark:text-dark-text',
    secondary: 'bg-light-surface dark:bg-dark-surface hover:bg-light-hover dark:hover:bg-dark-hover text-light-text dark:text-dark-text',
    danger: 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white',
    action: 'bg-light-primary dark:bg-dark-primary hover:opacity-90 text-white',
    custom: ''
  };
  const sizeClasses = {
    sm: label ? 'p-1.5 text-sm' : 'p-1.5',
    md: label ? 'p-2 text-base' : 'p-2',
    lg: label ? 'p-3 text-lg' : 'p-3'
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClick(e);
  };

  return (
    <button
      ref={ref}
      onClick={handleClick}
      disabled={disabled}
      type={type}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      title={label}
      aria-label={label}
    >
      {icon}
      {(label && showLabel) && <span>{label}</span>}
    </button>
  );
});

IconButton.displayName = 'IconButton';
