import React from 'react';

export type CategoryTagVariant = 'removable' | 'clickable';

interface CategoryTagProps {
  category: string;
  onClick: (e: React.MouseEvent, category: string) => void;
  variant: CategoryTagVariant;
  className?: string;
}

const CategoryTag: React.FC<CategoryTagProps> = ({
  category,
  onClick,
  variant,
  className = ""
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(e, category);
  };

  if (variant === 'removable') {
    return (
      <button
        onClick={handleClick}
        className={`flex items-center gap-1 px-2 py-1 rounded-md bg-light-hover/50 dark:bg-dark-hover/50 text-sm 
          hover:bg-light-hover dark:hover:bg-dark-hover transition-colors group ${className}`}
        type="button"
      >
        <span className='text-light-text dark:text-dark-text'>{category}</span>
        <span className="text-light-text-secondary dark:text-dark-text-secondary group-hover:text-light-text dark:group-hover:text-dark-text">×</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors duration-200 
        ${getCategoryColor(category)} ${className}`}
      type="button"
    >
      {category}
    </button>
  );
};

const getCategoryColor = (name: string) => {
  const colorSchemes = [
    {
      bg: 'bg-blue-500/20 dark:bg-blue-500/30',
      text: 'text-blue-700 dark:text-blue-200',
      hover: 'hover:bg-blue-500/30 dark:hover:bg-blue-500/40'
    },
    {
      bg: 'bg-emerald-500/20 dark:bg-emerald-500/30',
      text: 'text-emerald-700 dark:text-emerald-200',
      hover: 'hover:bg-emerald-500/30 dark:hover:bg-emerald-500/40'
    },
    {
      bg: 'bg-purple-500/20 dark:bg-purple-500/30',
      text: 'text-purple-700 dark:text-purple-200',
      hover: 'hover:bg-purple-500/30 dark:hover:bg-purple-500/40'
    },
    {
      bg: 'bg-amber-500/20 dark:bg-amber-500/30',
      text: 'text-amber-700 dark:text-amber-200',
      hover: 'hover:bg-amber-500/30 dark:hover:bg-amber-500/40'
    },
    {
      bg: 'bg-rose-500/20 dark:bg-rose-500/30',
      text: 'text-rose-700 dark:text-rose-200',
      hover: 'hover:bg-rose-500/30 dark:hover:bg-rose-500/40'
    },
    {
      bg: 'bg-cyan-500/20 dark:bg-cyan-500/30',
      text: 'text-cyan-700 dark:text-cyan-200',
      hover: 'hover:bg-cyan-500/30 dark:hover:bg-cyan-500/40'
    },
    {
      bg: 'bg-indigo-500/20 dark:bg-indigo-500/30',
      text: 'text-indigo-700 dark:text-indigo-200',
      hover: 'hover:bg-indigo-500/30 dark:hover:bg-indigo-500/40'
    },
    {
      bg: 'bg-teal-500/20 dark:bg-teal-500/30',
      text: 'text-teal-700 dark:text-teal-200',
      hover: 'hover:bg-teal-500/30 dark:hover:bg-teal-500/40'
    }
  ];
  
  const hash = name.split('').reduce((acc, char, i) => {
    return char.charCodeAt(0) + ((acc << 5) - acc) + i;
  }, 0);
  
  const scheme = colorSchemes[Math.abs(hash) % colorSchemes.length];
  return `${scheme.bg} ${scheme.text} ${scheme.hover}`;
};

export default CategoryTag;
