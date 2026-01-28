import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import CategoryTag, { type CategoryTagVariant } from "./CategoryTag";

interface CategoryListProps {
  categories: string[];
  onCategoryClick: (e: React.MouseEvent, category: string) => void;
  className?: string;
  variant: CategoryTagVariant;
  showAll?: boolean;
}

const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  onCategoryClick,
  className = "",
  variant,
  showAll = false,
}) => {
  const { t: translate } = useTranslation('components/categories');
  const [isExpanded, setIsExpanded] = useState(false);
  const [visibleCount, setVisibleCount] = useState(categories.length);
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showAll) return;

    const calculateVisibleCount = () => {
      const container = containerRef.current;
      const measure = measureRef.current;
      if (!container || !measure || categories.length === 0) return;

      measure.style.visibility = "hidden";
      measure.style.display = "flex";

      const containerWidth = container.offsetWidth;
      const items = Array.from(measure.children) as HTMLElement[];
      let currentWidth = 0;
      let count = 0;

      const moreButtonWidth = items[items.length - 1].offsetWidth + 8;

      for (let i = 0; i < items.length - 1; i++) {
        const itemWidth = items[i].offsetWidth + 8;
        if (currentWidth + itemWidth + moreButtonWidth > containerWidth) break;
        currentWidth += itemWidth;
        count++;
      }

      measure.style.display = "none";

      if (count > 0 && count !== visibleCount) {
        setVisibleCount(count);
      }
    };

    calculateVisibleCount();

    window.addEventListener("resize", calculateVisibleCount);
    return () => window.removeEventListener("resize", calculateVisibleCount);
  }, [categories, visibleCount, showAll]);

  if (categories.length === 0) {
    return (
      <div className={`relative ${className}`}>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-light-hover/50 dark:bg-dark-hover/50 text-light-text-secondary dark:text-dark-text-secondary">
            {translate('categoryList.noData')}
          </span>
        </div>
      </div>
    );
  }

  const visibleCategories =
    showAll || isExpanded ? categories : categories.slice(0, visibleCount);

  const hasMoreCategories = !showAll && categories.length > visibleCount;
  const moreCount = categories.length - visibleCount;

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(true);
  };

  const handleCollapseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(false);
  };

  return (
    <div className={`relative ${className}`}>
      <div ref={containerRef} className="flex flex-wrap items-center gap-1.5">
        {visibleCategories.map((category) => (
          <CategoryTag
            key={category}
            category={category}
            onClick={onCategoryClick}
            variant={variant}
          />
        ))}

        {hasMoreCategories && !isExpanded && (
          <button
            onClick={handleExpandClick}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs 
              font-medium bg-light-surface/20 dark:bg-dark-surface/20 text-light-text dark:text-dark-text 
              hover:bg-light-surface/30 dark:hover:bg-dark-surface/30 
              transition-colors duration-200"
          >
            <span>{translate('categoryList.moreCount', { moreCount })}</span>
            <ChevronDown size={12} />
          </button>
        )}

        {isExpanded && hasMoreCategories && (
          <button
            onClick={handleCollapseClick}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs 
              font-medium bg-light-surface/20 dark:bg-dark-surface/20 text-light-text dark:text-dark-text 
              hover:bg-light-surface/30 dark:hover:bg-dark-surface/30 
              transition-colors duration-200"
          >
            <span>{translate('categoryList.showLess')}</span>
            <ChevronUp size={12} />
          </button>
        )}
      </div>

      {!showAll && (
        <div
          ref={measureRef}
          className="absolute flex flex-wrap items-center gap-1.5"
          aria-hidden="true"
          style={{
            visibility: "hidden",
            position: "absolute",
            top: 0,
            left: 0,
          }}
        >
          {categories.map((category) => (
            <CategoryTag
              key={category}
              category={category}
              onClick={onCategoryClick}
              variant={variant}
            />
          ))}
          <button
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs 
              font-medium bg-light-surface/20 dark:bg-dark-surface/20 text-light-text dark:text-dark-text"
          >
            <span>{translate('categoryList.moreCount', { moreCount: 99 })}</span>
            <ChevronDown size={12} />
          </button>
        </div>
      )}
    </div>
  );
};

export default CategoryList;
