import React from 'react';
import { Search } from 'lucide-react';

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

  return (
    <div className={`relative ${className}`}>
      {showSearchIcon && (
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-light-text-secondary dark:text-dark-text-secondary pointer-events-none" />
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        className={`w-full px-4 py-2.5 border border-light-border dark:border-dark-border rounded-lg bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text placeholder:text-light-text-secondary dark:placeholder:text-dark-text-secondary focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary transition-shadow shadow-sm ${
          showSearchIcon ? 'pl-10' : ''
        }`}
      />
    </div>
  );
};
