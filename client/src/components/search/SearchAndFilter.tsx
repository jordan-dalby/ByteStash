import React from "react";
import {
  ChevronDown,
  Grid,
  List,
  Settings,
  Plus,
  Trash,
  Star,
} from "lucide-react";
import { SearchBar } from "./SearchBar";
import { IconButton } from "../common/buttons/IconButton";
import { useNavigate } from "react-router-dom";

export type SortOrder = "newest" | "oldest" | "alpha-asc" | "alpha-desc";

const sortOptions: { value: SortOrder; label: string }[] = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "alpha-asc", label: "Alphabetically A-Z" },
  { value: "alpha-desc", label: "Alphabetically Z-A" },
];

export interface SearchAndFilterProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  languages: string[];
  sortOrder: SortOrder;
  setSortOrder: (order: SortOrder) => void;
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
  openSettingsModal: () => void;
  openNewSnippetModal: () => void;
  allCategories: string[];
  selectedCategories: string[];
  onCategoryClick: (category: string) => void;
  hideNewSnippet?: boolean;
  hideRecycleBin?: boolean;
  showFavorites?: boolean;
  handleShowFavorites?: () => void;
}

export const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  searchTerm,
  setSearchTerm,
  selectedLanguage,
  onLanguageChange,
  languages,
  sortOrder,
  setSortOrder,
  viewMode,
  setViewMode,
  openSettingsModal,
  openNewSnippetModal,
  allCategories,
  selectedCategories,
  onCategoryClick,
  hideNewSnippet = false,
  hideRecycleBin = false,
  showFavorites,
  handleShowFavorites,
}) => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        onCategorySelect={onCategoryClick}
        existingCategories={allCategories}
        selectedCategories={selectedCategories}
      />

      <div className="relative">
        <select
          className="px-4 py-2 pr-10 rounded-lg appearance-none bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary"
          value={selectedLanguage}
          onChange={(e) => onLanguageChange(e.target.value)}
        >
          <option value="">All Languages</option>
          {languages.map((lang) => (
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
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as SortOrder)}
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
          label="Grid view"
        />
        <IconButton
          icon={<List size={20} />}
          onClick={() => setViewMode("list")}
          variant={viewMode === "list" ? "primary" : "secondary"}
          className="h-10 px-4"
          label="List view"
        />
        <IconButton
          icon={<Settings size={20} />}
          onClick={openSettingsModal}
          variant="secondary"
          className="h-10 px-4"
          label="Open settings"
        />
        {!hideNewSnippet && (
          <div className="flex gap-2">
            {!hideRecycleBin && (
              <IconButton
                icon={<Plus size={20} />}
                label="New Snippet"
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
              label={showFavorites ? "Show all" : "Show Favorites"}
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
              label="Recycle Bin"
            />
          </div>
        )}
      </div>
    </div>
  );
};
