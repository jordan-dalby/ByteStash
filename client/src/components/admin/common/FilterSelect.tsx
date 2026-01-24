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
        className="block w-full appearance-none rounded-md bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text p-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary h-10 mt-0 cursor-pointer"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="absolute right-2 top-1/2 -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary pointer-events-none"
        size={16}
      />
    </div>
  );
};
