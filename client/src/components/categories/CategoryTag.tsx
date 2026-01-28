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
  const colors = [
    'blue', 'emerald',
    'purple', 'amber',
    'rose', 'cyan',
    'indigo', 'teal',
  ];
  const colorSchemes = colors.map((color) => ({
    bg: `bg-${color}-500/20 dark:bg-${color}-500/30`,
    text: `text-${color}-700 dark:text-${color}-200`,
    hover: `hover:bg-${color}-500/30 dark:hover:bg-${color}-500/40`
  }));
  
  const hash = name.split('').reduce((acc, char, i) => {
    return char.charCodeAt(0) + ((acc << 5) - acc) + i;
  }, 0);
  
  const scheme = colorSchemes[Math.abs(hash) % colorSchemes.length];
  return `${scheme.bg} ${scheme.text} ${scheme.hover}`;
};

export default CategoryTag;
