import { useState, useEffect, useRef, useMemo, memo, useImperativeHandle, forwardRef } from 'react';
import { Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import BaseDropdown, { BaseDropdownRef } from '../common/dropdowns/BaseDropdown';
import { IconButton } from '../common/buttons/IconButton';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';
import { debounce } from '../../utils/helpers/debounce';

interface SearchBarProps {
  value?: string;
  onChange: (value: string) => void;
  onCategorySelect: (category: string) => void;
  existingCategories: string[];
  selectedCategories: string[];
  placeholder?: string;
}

export interface SearchBarRef {
  clear: () => void;
  getValue: () => string;
}

export const SearchBar = memo(forwardRef<SearchBarRef, SearchBarProps>(({
  value = '',
  onChange,
  onCategorySelect,
  existingCategories,
  selectedCategories,
  ...props
}, ref) => {
  const { t: translate } = useTranslation('components/search');
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<BaseDropdownRef>(null);

  const placeholder = props.placeholder || translate('defaultPlaceholder');

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const debouncedOnChange = useMemo(
    () => debounce((value: string) => {
      onChange(value);
    }, 300),
    [onChange]
  );

  useEffect(() => {
    return () => {
      debouncedOnChange.cancel();
    };
  }, [debouncedOnChange]);

  useImperativeHandle(ref, () => ({
    clear: () => {
      setInputValue('');
      debouncedOnChange.cancel();
      onChange('');
    },
    getValue: () => inputValue
  }), [inputValue, debouncedOnChange, onChange]);

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
        title: translate('categories.title'),
        items: filtered
      });
    }

    if (term && !existingCategories.some(cat => cat.toLowerCase() === term)) {
      sections.push({
        title: translate('categories.addNew'),
        items: [`${translate('categories.addNew')}: ${term}`]
      });
    }

    return sections;
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);

    // Don't trigger onChange while typing category (after #)
    // This prevents the hashtag portion from being sent to the backend
    if (!value.includes('#')) {
      debouncedOnChange(value);
    } else {
      // Cancel any pending debounced changes when # is typed
      debouncedOnChange.cancel();
    }
  };

  const handleSelect = (option: string) => {
    const newCategory = option.startsWith(`${translate('categories.addNew')}:`)
      ? option.slice(9).trim()
      : option;

    // Remove the hashtag portion from the search
    const hashtagIndex = inputValue.lastIndexOf('#');
    const newValue = hashtagIndex !== -1
      ? inputValue.substring(0, hashtagIndex).trim()
      : inputValue;

    // Update input value
    setInputValue(newValue);

    // Immediately call onChange with the cleaned value (no debounce)
    onChange(newValue);

    // Select the category
    onCategorySelect(newCategory.toLowerCase());
  };

  const handleClear = () => {
    setInputValue('');
    debouncedOnChange.cancel();
    onChange('');
  };

  return (
    <div className="relative flex-grow">
      <BaseDropdown
        ref={inputRef}
        value={inputValue}
        onChange={handleInputChange}
        onSelect={handleSelect}
        getSections={getSections}
        placeholder={placeholder}
        className="h-10 mt-0 bg-light-surface dark:bg-dark-surface"
        showChevron={false}
      />
      {inputValue && (
        <IconButton
          icon={<X size={20} />}
          onClick={handleClear}
          variant="secondary"
          className="absolute right-3 top-1/2 -translate-y-1/2 mr-4 text-light-text-secondary dark:text-dark-text-secondary"
          label={translate('action.clear')}
        />
      )}
      <Search
        className="absolute right-3 top-1/2 -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary pointer-events-none"
        size={16}
      />
    </div>
  );
}));

SearchBar.displayName = 'SearchBar';
