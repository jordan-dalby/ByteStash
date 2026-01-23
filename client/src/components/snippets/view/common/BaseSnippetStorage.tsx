import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { initializeMonaco } from "../../../../utils/language/languageUtils";
import { snippetService } from "../../../../service/snippetService";
import { Snippet } from "../../../../types/snippets";
import { SearchAndFilter } from "../../../search/SearchAndFilter";
import { UserDropdown } from "../../../auth/UserDropdown";
import StorageHeader from "./StorageHeader";
import SnippetContentArea from "./SnippetContentArea";
import EditSnippetModal from "../../edit/EditSnippetModal";
import SettingsModal from "../../../settings/SettingsModal";
import { ShareMenu } from "../../share/ShareMenu";
import { useSettings } from "../../../../hooks/useSettings";
import { useAuth } from "../../../../hooks/useAuth";
import { useToast } from "../../../../hooks/useToast";
import { useCreateSnippet, useEditSnippet } from "../../../../hooks/useSnippetsQuery";

const BaseSnippetStorage: React.FC = () => {
  const [, setSearchParams] = useSearchParams();
  const { addToast } = useToast();
  const { isAuthenticated, logout } = useAuth();
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
    showFavorites,
    setShowFavorites,
  } = useSettings();

  // Metadata - loaded once, never changes
  const [metadata, setMetadata] = useState<{ categories: string[]; languages: string[] }>({
    categories: [],
    languages: []
  });

  // UI state
  const [isEditSnippetModalOpen, setIsEditSnippetModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [snippetToEdit, setSnippetToEdit] = useState<Snippet | null>(null);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [snippetToShare, setSnippetToShare] = useState<Snippet | null>(null);

  const mountedRef = useRef(false);

  // React Query mutations
  const createSnippetMutation = useCreateSnippet();
  const editSnippetMutation = useEditSnippet();

  useEffect(() => {
    mountedRef.current = true;
    initializeMonaco();
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Load metadata once
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const data = await snippetService.getSnippetsMetadata();
        setMetadata(data);
      } catch (error) {
        console.error("Failed to fetch metadata:", error);
      }
    };
    fetchMetadata();
  }, []);

  // Stable callbacks that only update URL - these NEVER change
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

  const handleShowFavorites = useCallback(() => {
    setShowFavorites((prev) => {
      const newValue = !prev;
      if (newValue) {
        addToast("Displaying favorite snippets", "success");
      } else {
        addToast("Displaying all snippets", "info");
      }
      return newValue;
    });
  }, [setShowFavorites, addToast]);

  // Modal handlers
  const openEditSnippetModal = useCallback((snippet: Snippet | null = null) => {
    setSnippetToEdit(snippet);
    setIsEditSnippetModalOpen(true);
  }, []);

  const closeEditSnippetModal = useCallback(() => {
    setSnippetToEdit(null);
    setIsEditSnippetModalOpen(false);
  }, []);

  const handleSnippetSubmit = useCallback(async (snippetData: Omit<Snippet, "id" | "updated_at">) => {
    try {
      if (snippetToEdit) {
        await editSnippetMutation.mutateAsync({ id: snippetToEdit.id, snippet: snippetData });
        addToast("Snippet updated successfully", "success");
      } else {
        await createSnippetMutation.mutateAsync(snippetData);
        addToast("New snippet created successfully", "success");
      }
      closeEditSnippetModal();
    } catch (error: any) {
      console.error("Error saving snippet:", error);
      if (error.status === 401 || error.status === 403) {
        logout();
        addToast("Session expired. Please login again.", "error");
      } else {
        addToast(snippetToEdit ? "Failed to update snippet" : "Failed to create snippet", "error");
      }
      throw error;
    }
  }, [snippetToEdit, createSnippetMutation, editSnippetMutation, addToast, logout, closeEditSnippetModal]);

  const openShareMenu = useCallback((snippet: Snippet) => {
    setSnippetToShare(snippet);
    setIsShareMenuOpen(true);
  }, []);

  const closeShareMenu = useCallback(() => {
    setSnippetToShare(null);
    setIsShareMenuOpen(false);
  }, []);

  const handleSettingsOpen = useCallback(() => setIsSettingsModalOpen(true), []);
  const handleNewSnippet = useCallback(() => openEditSnippetModal(null), [openEditSnippetModal]);

  return (
    <>
      <div className="min-h-screen p-8 bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text">
        <div className="flex items-start justify-between mb-4">
          <StorageHeader isPublicView={false} />
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
          showFavorites={showFavorites}
          handleShowFavorites={handleShowFavorites}
          hideNewSnippet={false}
          hideRecycleBin={false}
          isPublicView={false}
        />

        <SnippetContentArea
          includeCodeInSearch={includeCodeInSearch}
          showFavorites={showFavorites}
          viewMode={viewMode}
          compactView={compactView}
          showCodePreview={showCodePreview}
          previewLines={previewLines}
          showCategories={showCategories}
          expandCategories={expandCategories}
          showLineNumbers={showLineNumbers}
          isAuthenticated={isAuthenticated}
          onCategoryClick={handleCategoryToggle}
          onSnippetSelect={() => {}}
          onEdit={openEditSnippetModal}
          onShare={openShareMenu}
        />
      </div>

      <EditSnippetModal
        isOpen={isEditSnippetModalOpen}
        onClose={closeEditSnippetModal}
        onSubmit={handleSnippetSubmit}
        snippetToEdit={snippetToEdit}
        showLineNumbers={showLineNumbers}
        allCategories={metadata.categories}
      />

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
        snippets={[]}
        addSnippet={() => Promise.resolve({} as Snippet)}
        reloadSnippets={() => {}}
        isPublicView={false}
      />

      {snippetToShare && (
        <ShareMenu
          snippet={snippetToShare}
          isOpen={isShareMenuOpen}
          onClose={closeShareMenu}
        />
      )}
    </>
  );
};

export default BaseSnippetStorage;
