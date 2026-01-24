import React from 'react';

export type StatusVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral';

export interface StatusBadgeProps {
  label: string;
  variant: StatusVariant;
  icon?: React.ReactNode;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant,
  icon,
  className = '',
}) => {
  const variantClasses = {
    success: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 border border-green-200 dark:border-green-800',
    danger: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 border border-red-200 dark:border-red-800',
    warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800',
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
    neutral: 'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300 border border-gray-200 dark:border-gray-700',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${variantClasses[variant]} ${className}`}
    >
      {icon}
      {label}
    </span>
  );
};
