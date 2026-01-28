import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Section {
  title: string;
  items: string[];
}

export interface BaseDropdownProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  getSections: (searchTerm: string) => Section[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxLength?: number;
  showChevron?: boolean;
}

/**
 * Ref interface for BaseDropdown component
 */
export interface BaseDropdownRef {
  /** Focus the dropdown input */
  focus: () => void;
}

const BaseDropdown = forwardRef<BaseDropdownRef, BaseDropdownProps>(({
  value,
  onChange,
  onSelect,
  onKeyDown,
  getSections,
  className = "",
  disabled = false,
  maxLength,
  showChevron = true,
  ...props
}, ref) => {
  const { t: translate } = useTranslation('components/common/dropdowns');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [internalValue, setInternalValue] = useState(value);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const lastInteractionWasMouse = useRef(false);

  const placeholder = props.placeholder || translate('baseDropdown.defaultPlaceholder');

  useImperativeHandle(ref, () => ({
    focus: () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    },
  }));

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const getAllItems = (sections: Section[]): string[] => {
    return sections.reduce(
      (acc: string[], section) => [...acc, ...section.items],
      []
    );
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setHighlightedIndex(-1);
        setInternalValue(value);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value]);

  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.querySelector(
        `[data-index="${highlightedIndex}"]`
      );
      if (highlightedElement) {
        if (!lastInteractionWasMouse.current) {
          highlightedElement.scrollIntoView({ block: "nearest" });
        }
      }
    }
  }, [highlightedIndex]);

  const handleMouseEnter = (index: number) => {
    lastInteractionWasMouse.current = true;
    setHighlightedIndex(index);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = maxLength
      ? e.target.value.slice(0, maxLength)
      : e.target.value;
    setInternalValue(newValue);
    onChange(newValue);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const addNewLabel = translate('baseDropdown.addNewLabel');

  const handleOptionClick = (option: string) => {
    const finalValue = option.startsWith(`${addNewLabel}:`)
      ? option.slice(9).trim()
      : option;
    setInternalValue(finalValue);
    onSelect(finalValue);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onKeyDown) {
      onKeyDown(e);
      if (e.defaultPrevented) return;
    }

    const sections = getSections(internalValue);
    const allItems = getAllItems(sections);
    const totalItems = allItems.length;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        }
        setHighlightedIndex((prev) =>
          prev < totalItems - 1 ? prev + 1 : totalItems - 1
        );
        break;

      case "ArrowUp":
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        }
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;

      case "Enter":
        e.preventDefault();
        if (isOpen) {
          if (highlightedIndex >= 0 && highlightedIndex < totalItems) {
            handleOptionClick(allItems[highlightedIndex]);
          } else if (sections.length > 0) {
            const lastSection = sections[sections.length - 1];
            if (lastSection.items.length > 0) {
              handleOptionClick(lastSection.items[0]);
            }
          }
          setIsOpen(false);
        }
        break;

      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        setInternalValue(value);
        break;

      case "Tab":
        setIsOpen(false);
        setHighlightedIndex(-1);
        setInternalValue(value);
        break;
    }
  };

  const sections = getSections(internalValue);
  let currentIndex = -1;

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          className={`block w-full rounded-md bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text p-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary ${className}`}
          value={internalValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          role="combobox"
        />
        {showChevron && (
          <ChevronDown
            className={`absolute right-2 top-1/2 -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
            size={16}
          />
        )}
      </div>
      {isOpen && sections.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-10 w-full mt-1 overflow-auto border rounded-md shadow-lg bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border max-h-60"
          role="listbox"
        >
          {sections.map((section, sectionIndex) => (
            <React.Fragment key={section.title}>
              {sectionIndex > 0 && (
                <li
                  className="border-t border-light-border dark:border-dark-border"
                  role="separator"
                />
              )}
              <li className="px-3 py-1 text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary bg-light-hover dark:bg-dark-hover">
                {section.title}
              </li>
              {section.items.map((item) => {
                currentIndex++;
                return (
                  <li
                    key={`${section.title}-${item}`}
                    className={`px-4 py-2 cursor-pointer text-light-text dark:text-dark-text text-sm ${
                      highlightedIndex === currentIndex
                        ? "bg-light-primary/20 dark:bg-dark-primary/20"
                        : "hover:bg-light-hover dark:hover:bg-dark-hover"
                    }`}
                    onClick={() => handleOptionClick(item)}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => handleMouseEnter(currentIndex)}
                    data-index={currentIndex}
                    role="option"
                    aria-selected={highlightedIndex === currentIndex}
                  >
                    {item}
                  </li>
                );
              })}
            </React.Fragment>
          ))}
        </ul>
      )}
    </div>
  );
});

BaseDropdown.displayName = 'BaseDropdown';

export default BaseDropdown;
