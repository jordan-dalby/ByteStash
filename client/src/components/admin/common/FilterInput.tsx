import React from 'react';
import { Search, X } from 'lucide-react';
import { IconButton } from '../../common/buttons/IconButton';

export interface FilterInputProps {
  value: string;
  onChange: (value: string) => void;
  onReset?: () => void;
  placeholder?: string;
  type?: 'text' | 'number';
  className?: string;
  showSearchIcon?: boolean;
}

export const FilterInput: React.FC<FilterInputProps> = ({
  value,
  onChange,
  onReset,
  placeholder = 'Search...',
  type = 'text',
  className = '',
  showSearchIcon = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    if (onReset && newValue === '') {
      onReset();
    }
  };

  const handleClear = () => {
    onChange('');
    if (onReset) {
      onReset();
    }
  };

  return (
    <div className={`relative flex-grow ${className}`}>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        className={`block w-full rounded-md bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text p-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary h-10 mt-0`}
      />
      {value && (
        <IconButton
          icon={<X size={20} />}
          onClick={handleClear}
          variant="secondary"
          className="absolute right-3 top-1/2 -translate-y-1/2 mr-4 text-light-text-secondary dark:text-dark-text-secondary"
          label="Clear search"
        />
      )}
      {showSearchIcon && (
        <Search
          className="absolute right-3 top-1/2 -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary pointer-events-none"
          size={16}
        />
      )}
    </div>
  );
};
