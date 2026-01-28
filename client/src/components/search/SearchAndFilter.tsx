import React, { memo, useMemo } from "react";
import {
  ChevronDown,
  Grid,
  List,
  Settings,
  Plus,
  Trash,
  Star,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { SearchBar } from "./SearchBar";
import { IconButton } from "../common/buttons/IconButton";
import { useNavigate, useSearchParams } from "react-router-dom";

export interface SearchAndFilterProps {
  metadata: { categories: string[]; languages: string[] };
  onSearchChange: (search: string) => void;
  onLanguageChange: (language: string) => void;
  onCategoryToggle: (category: string) => void;
  onSortChange: (sort: string) => void;
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
  openSettingsModal: () => void;
  openNewSnippetModal: () => void;
  hideNewSnippet?: boolean;
  hideRecycleBin?: boolean;
  showFavorites?: boolean;
  handleShowFavorites?: () => void;
  isPublicView?: boolean;
}

export const SearchAndFilter: React.FC<SearchAndFilterProps> = memo(({
  metadata,
  onSearchChange,
  onLanguageChange,
  onCategoryToggle,
  onSortChange,
  viewMode,
  setViewMode,
  openSettingsModal,
  openNewSnippetModal,
  hideNewSnippet = false,
  hideRecycleBin = false,
  showFavorites,
  handleShowFavorites,
}) => {
  const { t: translate } = useTranslation('components/search');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const selectedCategories = useMemo(() =>
    searchParams.get("categories")?.split(",").filter(Boolean) || [],
    [searchParams]
  );

  const currentLanguage = useMemo(() =>
    searchParams.get("language") || "",
    [searchParams]
  );

  const currentSort = useMemo(() =>
    searchParams.get("sort") || "newest",
    [searchParams]
  );

  const currentSearch = useMemo(() =>
    searchParams.get("search") || "",
    [searchParams]
  );

  const sortOptions = [
    { value: "newest" as const, label: translate('sort.newestFirst') },
    { value: "oldest" as const, label: translate('sort.oldestFirst') },
    { value: "alpha-asc" as const, label: translate('sort.alphaAsc') },
    { value: "alpha-desc" as const, label: translate('sort.alphaDesc') },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <SearchBar
        value={currentSearch}
        onChange={onSearchChange}
        onCategorySelect={onCategoryToggle}
        existingCategories={metadata.categories}
        selectedCategories={selectedCategories}
      />

      <div className="relative">
        <select
          className="px-4 py-2 pr-10 rounded-lg appearance-none bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary"
          value={currentLanguage}
          onChange={(e) => onLanguageChange(e.target.value)}
        >
          <option value="">{translate('filter.language.all')}</option>
          {metadata.languages.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
        <ChevronDown
          className="absolute -translate-y-1/2 pointer-events-none right-2 top-1/2 text-light-text-secondary dark:text-dark-text-secondary"
          size={20}
        />
      </div>

      <div className="relative">
        <select
          className="px-4 py-2 pr-10 rounded-lg appearance-none bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary"
          value={currentSort}
          onChange={(e) => onSortChange(e.target.value)}
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="absolute -translate-y-1/2 pointer-events-none right-2 top-1/2 text-light-text-secondary dark:text-dark-text-secondary"
          size={20}
        />
      </div>

      <div className="flex items-center gap-2">
        <IconButton
          icon={<Grid size={20} />}
          onClick={() => setViewMode("grid")}
          variant={viewMode === "grid" ? "primary" : "secondary"}
          className="h-10 px-4"
          label={translate('view.grid')}
        />
        <IconButton
          icon={<List size={20} />}
          onClick={() => setViewMode("list")}
          variant={viewMode === "list" ? "primary" : "secondary"}
          className="h-10 px-4"
          label={translate('view.list')}
        />
        <IconButton
          icon={<Settings size={20} />}
          onClick={openSettingsModal}
          variant="secondary"
          className="h-10 px-4"
          label={translate('action.openSettings')}
        />
        {!hideNewSnippet && (
          <div className="flex gap-2">
            {!hideRecycleBin && (
              <IconButton
                icon={<Plus size={20} />}
                label={translate('action.newSnippet')}
                onClick={openNewSnippetModal}
                variant="action"
                className="h-10 pl-2 pr-4"
                showLabel
              />
            )}
            <IconButton
              icon={<Star size={20} />}
              onClick={handleShowFavorites || (() => {})}
              variant={showFavorites ? "primary" : "secondary"}
              className="h-10 px-4"
              label={showFavorites ? translate('action.showAll') : translate('action.showFavorites')}
            />
            <IconButton
              icon={<Trash size={20} />}
              onClick={() => navigate("/recycle/snippets")}
              variant={
                location.pathname === "/recycle/snippets"
                  ? "primary"
                  : "secondary"
              }
              className="h-10 px-4"
              label={translate('action.recycleBin')}
            />
          </div>
        )}
      </div>
    </div>
  );
});

SearchAndFilter.displayName = 'SearchAndFilter';
