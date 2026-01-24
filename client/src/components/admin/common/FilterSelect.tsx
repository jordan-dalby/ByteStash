import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  onReset?: () => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
}

export const FilterSelect: React.FC<FilterSelectProps> = ({
  value,
  onChange,
  onReset,
  options,
  placeholder = 'Select...',
  className = '',
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    if (onReset && newValue === '') {
      onReset();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={handleChange}
        className="w-full appearance-none px-4 py-2.5 pr-10 border border-light-border dark:border-dark-border rounded-lg bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary transition-shadow shadow-sm cursor-pointer"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-light-text-secondary dark:text-dark-text-secondary pointer-events-none" />
    </div>
  );
};
