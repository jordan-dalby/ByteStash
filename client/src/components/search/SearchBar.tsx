import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import BaseDropdown, { BaseDropdownRef } from '../common/dropdowns/BaseDropdown';
import { IconButton } from '../common/buttons/IconButton';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onCategorySelect: (category: string) => void;
  existingCategories: string[];
  selectedCategories: string[];
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onCategorySelect,
  existingCategories,
  selectedCategories,
  placeholder = "Search snippets... (Type # to see all available categories)"
}) => {
  const [inputValue, setInputValue] = useState(value);
  const lastValueRef = useRef(value);
  const inputRef = useRef<BaseDropdownRef>(null);

  useEffect(() => {
    if (value !== lastValueRef.current) {
      setInputValue(value);
      lastValueRef.current = value;
    }
  }, [value]);

  // Focus the search input when "/" key is pressed
  useKeyboardShortcut({
    key: '/',
    callback: () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    },
  });

  const getSections = (searchTerm: string) => {
    if (!searchTerm.includes('#')) return [];

    const term = searchTerm.slice(searchTerm.lastIndexOf('#') + 1).trim().toLowerCase();
    const sections = [];
    
    const availableCategories = existingCategories.filter(
      cat => !selectedCategories.includes(cat.toLowerCase())
    );

    const filtered = term
      ? availableCategories.filter(cat => cat.toLowerCase().includes(term))
      : availableCategories;

    if (filtered.length > 0) {
      sections.push({
        title: 'Categories',
        items: filtered
      });
    }

    if (term && !existingCategories.some(cat => cat.toLowerCase() === term)) {
      sections.push({
        title: 'Add New',
        items: [`Add new: ${term}`]
      });
    }

    return sections;
  };

  const handleSelect = (option: string) => {
    const newCategory = option.startsWith('Add new:') 
      ? option.slice(9).trim() 
      : option;

    const hashtagIndex = inputValue.lastIndexOf('#');
    if (hashtagIndex !== -1) {
      const newValue = inputValue.substring(0, hashtagIndex).trim();
      setInputValue(newValue);
      onChange(newValue);
    }

    onCategorySelect(newCategory.toLowerCase());
  };

  return (
    <div className="relative flex-grow">
      <BaseDropdown
        ref={inputRef}
        value={inputValue}
        onChange={(value) => {
          setInputValue(value);
          onChange(value);
        }}
        onSelect={handleSelect}
        getSections={getSections}
        placeholder={placeholder}
        className="h-10 mt-0 bg-light-surface dark:bg-dark-surface"
        showChevron={false}
      />
      {inputValue && (
        <IconButton
          icon={<X size={20} />}
        onClick={() => {
          setInputValue('');
          onChange('');
        }}
        variant="secondary"
        className="absolute right-3 top-1/2 -translate-y-1/2 mr-4 text-light-text-secondary dark:text-dark-text-secondary"
        label="Clear search"
        />
      )}
      <Search 
        className="absolute right-3 top-1/2 -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary pointer-events-none" 
        size={16} 
      />
    </div>
  );
};
