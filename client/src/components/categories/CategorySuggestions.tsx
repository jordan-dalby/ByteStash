import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import BaseDropdown from '../common/dropdowns/BaseDropdown';

export interface CategorySuggestionsProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onCategorySelect: (category: string) => void;
  existingCategories: string[];
  selectedCategories: string[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showAddText?: boolean;
  maxCategories?: number;
  handleHashtag: boolean;
}

const CategorySuggestions: React.FC<CategorySuggestionsProps> = ({
  inputValue,
  onInputChange,
  onCategorySelect,
  existingCategories,
  selectedCategories,
  disabled = false,
  className = "",
  maxCategories,
  handleHashtag = false,
  ...props
}) => {
  const { t: translate } = useTranslation('components/categories');
  const [internalValue, setInternalValue] = useState(inputValue);

  const placeholder = props.placeholder || translate('categorySuggestions.placeholder');
  const addNewLabel = translate('categorySuggestions.addNewLabel');

  useEffect(() => {
    setInternalValue(inputValue);
  }, [inputValue]);

  const getSections = (searchTerm: string) => {
    const term = handleHashtag
      ? searchTerm.slice(searchTerm.lastIndexOf('#') + 1).trim().toLowerCase()
      : searchTerm.trim().toLowerCase();

    if (handleHashtag && !searchTerm.includes('#')) {
      return [];
    }

    const sections = [];
    
    const availableCategories = existingCategories.filter(
      cat => !selectedCategories.includes(cat.toLowerCase())
    );

    const filtered = term
      ? availableCategories.filter(cat => 
          cat.toLowerCase().includes(term)
        )
      : availableCategories;

    if (filtered.length > 0) {
      sections.push({
        title: translate('categorySuggestions.title'),
        items: filtered
      });
    }

    if (term && term.length > 0 && 
        !existingCategories.some(cat => cat.toLowerCase() === term)) {
      sections.push({
        title: addNewLabel,
        items: [`${addNewLabel}: ${term}`]
      });
    }

    return sections;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ',') {
      e.preventDefault();
      const term = handleHashtag
        ? internalValue.slice(internalValue.lastIndexOf('#') + 1).trim()
        : internalValue.trim();
      
      if (term) {
        handleSelect(`${addNewLabel}: ${term}`);
      }
    }
  };

  const handleChange = (newValue: string) => {
    setInternalValue(newValue);
    onInputChange(newValue);
  };

  const handleSelect = (option: string) => {
    let newCategory;
    if (option.startsWith(`${addNewLabel}:`)) {
      newCategory = option.slice(9).trim();
    } else {
      newCategory = option;
    }

    if (handleHashtag) {
      const hashtagIndex = internalValue.lastIndexOf('#');
      if (hashtagIndex !== -1) {
        const newValue = internalValue.substring(0, hashtagIndex).trim();
        setInternalValue(newValue);
        onInputChange(newValue);
      }
    } else {
      setInternalValue('');
      onInputChange('');
    }

    onCategorySelect(newCategory.toLowerCase());
  };

  return (
    <BaseDropdown
      value={internalValue}
      onChange={handleChange}
      onSelect={handleSelect}
      onKeyDown={handleKeyDown}
      getSections={getSections}
      placeholder={placeholder}
      className={className}
      disabled={disabled || (maxCategories !== undefined && selectedCategories.length >= maxCategories)}
      showChevron={false}
    />
  );
};

export default CategorySuggestions;