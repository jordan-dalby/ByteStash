import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useSettings } from "../../../../hooks/useSettings";
import { useAuth } from "../../../../hooks/useAuth";
import { initializeMonaco } from "../../../../utils/language/languageUtils";
import { snippetService } from "../../../../service/snippetService";
import SettingsModal from "../../../settings/SettingsModal";
import { SearchAndFilter } from "../../../search/SearchAndFilter";
import { UserDropdown } from "../../../auth/UserDropdown";
import StorageHeader from "../common/StorageHeader";
import PublicSnippetContentArea from "./PublicSnippetContentArea";

const PublicSnippetStorage: React.FC = () => {
  // URL-based filter state
  const [, setSearchParams] = useSearchParams();

  // Settings
  const {
    viewMode,
    setViewMode,
    compactView,
    showCodePreview,
    previewLines,
    includeCodeInSearch,
    updateSettings,
    showCategories,
    expandCategories,
    showLineNumbers,
    theme,
  } = useSettings();

  const { isAuthenticated } = useAuth();

  // Metadata - loaded once
  const [metadata, setMetadata] = useState<{ categories: string[]; languages: string[] }>({
    categories: [],
    languages: []
  });

  // UI state
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  useEffect(() => {
    initializeMonaco();
  }, []);

  // Load metadata once
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const data = await snippetService.getPublicSnippetsMetadata();
        setMetadata(data);
      } catch (error) {
        console.error("Failed to fetch metadata:", error);
      }
    };
    fetchMetadata();
  }, []);


  // URL update handlers - stable callbacks
  const handleSearchChange = useCallback((search: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      const trimmedSearch = search.trim();
      if (trimmedSearch) {
        next.set("search", trimmedSearch);
      } else {
        next.delete("search");
      }
      return next;
    });
  }, [setSearchParams]);

  const handleLanguageChange = useCallback((language: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (language) {
        next.set("language", language);
      } else {
        next.delete("language");
      }
      return next;
    });
  }, [setSearchParams]);

  const handleCategoryToggle = useCallback((category: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      const current = next.get("categories")?.split(",").filter(Boolean) || [];
      const updated = current.includes(category)
        ? current.filter(c => c !== category)
        : [...current, category];

      if (updated.length > 0) {
        next.set("categories", updated.join(","));
      } else {
        next.delete("categories");
      }
      return next;
    });
  }, [setSearchParams]);

  const handleSortChange = useCallback((sort: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("sort", sort);
      return next;
    });
  }, [setSearchParams]);

  // Handlers
  const handleSettingsOpen = useCallback(() => setIsSettingsModalOpen(true), []);
  const handleNewSnippet = useCallback(() => null, []);

  return (
    <>
      <div className="min-h-screen p-8 bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text">
        <div className="flex items-start justify-between mb-4">
          <StorageHeader isPublicView={true} />
          <UserDropdown />
        </div>

        <SearchAndFilter
          metadata={metadata}
          onSearchChange={handleSearchChange}
          onLanguageChange={handleLanguageChange}
          onCategoryToggle={handleCategoryToggle}
          onSortChange={handleSortChange}
          viewMode={viewMode}
          setViewMode={setViewMode}
          openSettingsModal={handleSettingsOpen}
          openNewSnippetModal={handleNewSnippet}
          hideNewSnippet={true}
          hideRecycleBin={false}
        />

        <PublicSnippetContentArea
          includeCodeInSearch={includeCodeInSearch}
          viewMode={viewMode}
          compactView={compactView}
          showCodePreview={showCodePreview}
          previewLines={previewLines}
          showCategories={showCategories}
          expandCategories={expandCategories}
          showLineNumbers={showLineNumbers}
          isAuthenticated={isAuthenticated}
          onCategoryClick={handleCategoryToggle}
        />
      </div>

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={{
          compactView,
          showCodePreview,
          previewLines,
          includeCodeInSearch,
          showCategories,
          expandCategories,
          showLineNumbers,
          theme,
        }}
        onSettingsChange={updateSettings}
        isPublicView={true}
      />
    </>
  );
};

export default PublicSnippetStorage;
