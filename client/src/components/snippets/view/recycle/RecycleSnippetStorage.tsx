import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeftToLine, Trash2 } from "lucide-react";
import { useSettings } from "../../../../hooks/useSettings";
import { useToast } from "../../../../hooks/useToast";
import { useAuth } from "../../../../hooks/useAuth";
import { initializeMonaco } from "../../../../utils/language/languageUtils";
import { snippetService } from "../../../../service/snippetService";
import { Snippet } from "../../../../types/snippets";
import { useDeleteSnippet } from "../../../../hooks/useSnippetsQuery";
import SettingsModal from "../../../settings/SettingsModal";
import { SearchAndFilter } from "../../../search/SearchAndFilter";
import { UserDropdown } from "../../../auth/UserDropdown";
import StorageHeader from "../common/StorageHeader";
import { IconButton } from "../../../common/buttons/IconButton";
import { ConfirmationModal } from "../../../common/modals/ConfirmationModal";
import RecycleSnippetContentArea from "./RecycleSnippetContentArea";

const RecycleSnippetStorage: React.FC = () => {
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

  const { isAuthenticated, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Metadata - loaded once
  const [metadata, setMetadata] = useState<{ categories: string[]; languages: string[] }>({
    categories: [],
    languages: []
  });

  // UI state
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isPermanentDeleteAllModalOpen, setIsPermanentDeleteAllModalOpen] = useState(false);

  // Ref to track all snippets for bulk delete
  const snippetsRef = useRef<Snippet[]>([]);

  // React Query mutation
  const deleteSnippetMutation = useDeleteSnippet();

  useEffect(() => {
    initializeMonaco();
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


  // Snippet operations
  const permanentDeleteAllSnippets = useCallback(async () => {
    try {
      await Promise.all(snippetsRef.current.map((s) => deleteSnippetMutation.mutateAsync(s.id)));
      addToast("All snippets in the recycle bin are cleared.", "success");
    } catch (error: any) {
      console.error("Failed to clear all recycle bin snippets:", error);
      if (error.status === 401 || error.status === 403) {
        logout();
        addToast("Session expired. Please login again.", "error");
      } else {
        addToast("Failed to clear recycle bin. Please try again.", "error");
      }
    }
  }, [deleteSnippetMutation, addToast, logout]);

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
  const handleSnippetsChange = useCallback((snippets: Snippet[]) => {
    snippetsRef.current = snippets;
  }, []);

  const openPermanentDeleteAllModal = useCallback(() => {
    if (snippetsRef.current.length === 0) {
      addToast("No snippets in the recycle bin to clear.", "info");
      return;
    }
    setIsPermanentDeleteAllModalOpen(true);
  }, [addToast]);

  const handlePermanentDeleteAllConfirm = useCallback(async () => {
    setIsPermanentDeleteAllModalOpen(false);
    await permanentDeleteAllSnippets();
  }, [permanentDeleteAllSnippets]);

  const handleSettingsOpen = useCallback(() => setIsSettingsModalOpen(true), []);
  const handleNewSnippet = useCallback(() => null, []);

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
          hideNewSnippet={true}
          hideRecycleBin={true}
        />

        <div className="mb-6 space-y-3">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm font-medium text-white hover:underline"
          >
            <ArrowLeftToLine size={18} /> Back to Snippets
          </button>

          <div className="flex items-center justify-between text-sm text-light-text-primary dark:text-dark-text-secondary">
            <div>
              <h1 className="text-2xl font-semibold text-white">Recycle Bin</h1>
              <p className="text-sm">
                Snippets in the recycle bin will be permanently deleted after 30 days.
              </p>
            </div>

            <IconButton
              icon={<Trash2 size={18} />}
              label="Clear all"
              showLabel={true}
              variant="danger"
              size="sm"
              onClick={openPermanentDeleteAllModal}
            />
          </div>
        </div>

        <RecycleSnippetContentArea
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
          onSnippetsChange={handleSnippetsChange}
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
        snippets={[]}
        addSnippet={() => Promise.resolve({} as Snippet)}
        reloadSnippets={() => {}}
        isPublicView={true}
      />

      <ConfirmationModal
        isOpen={isPermanentDeleteAllModalOpen}
        onClose={() => setIsPermanentDeleteAllModalOpen(false)}
        onConfirm={handlePermanentDeleteAllConfirm}
        title="Confirm Deletion"
        message={`Are you sure you want to permanently clear all snippets in the recycle bin? This action cannot be undone.`}
        confirmLabel="Delete Permanently"
        cancelLabel="Cancel"
        variant="danger"
      />
    </>
  );
};

export default RecycleSnippetStorage;
