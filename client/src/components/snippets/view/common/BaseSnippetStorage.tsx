import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowLeftToLine, Loader2, Trash2 } from "lucide-react";
import { Snippet } from "../../../../types/snippets";
import { getLanguageLabel } from "../../../../utils/language/languageUtils";
import { SearchAndFilter } from "../../../search/SearchAndFilter";
import SnippetList from "../../list/SnippetList";
import SnippetModal from "../SnippetModal";
import { PageContainer } from "../../../common/layout/PageContainer";
import { useNavigate } from "react-router-dom";
import StorageHeader from "./StorageHeader";
import { IconButton } from "../../../common/buttons/IconButton";
import { ConfirmationModal } from "../../../common/modals/ConfirmationModal";
import { useToast } from "../../../../hooks/useToast";

interface BaseSnippetStorageProps {
  snippets: Snippet[];
  isLoading: boolean;
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
  compactView: boolean;
  showCodePreview: boolean;
  previewLines: number;
  includeCodeInSearch: boolean;
  showCategories: boolean;
  expandCategories: boolean;
  showLineNumbers: boolean;
  onSettingsOpen: () => void;
  onNewSnippet: () => void;
  onDelete?: (id: string) => Promise<void>;
  onPermanentDeleteAll?: (snippets: Snippet[]) => Promise<void>;
  onRestore?: (id: string) => Promise<void>;
  onEdit?: (snippet: Snippet) => void;
  onShare?: (snippet: Snippet) => void;
  onDuplicate?: (snippet: Snippet) => void;
  headerRight: React.ReactNode;
  isPublicView: boolean;
  isRecycleView: boolean;
  isAuthenticated: boolean;
  pinSnippet?: (id: string, isPinned: boolean) => Promise<Snippet | undefined>;
  favoriteSnippet?: (
    id: string,
    isFavorite: boolean
  ) => Promise<Snippet | undefined>;
  showFavorites?: boolean;
  handleShowFavorites?: () => void;
}

const BaseSnippetStorage: React.FC<BaseSnippetStorageProps> = ({
  snippets,
  isLoading,
  viewMode,
  setViewMode,
  compactView,
  showCodePreview,
  previewLines,
  includeCodeInSearch,
  showCategories,
  expandCategories,
  showLineNumbers,
  onSettingsOpen,
  onNewSnippet,
  onDelete,
  onPermanentDeleteAll,
  onRestore,
  onEdit,
  onShare,
  onDuplicate,
  headerRight,
  isPublicView,
  isRecycleView,
  isAuthenticated,
  pinSnippet,
  favoriteSnippet,
  showFavorites,
  handleShowFavorites,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(null);
  const [sortOrder, setSortOrder] = useState<
    "newest" | "oldest" | "alpha-asc" | "alpha-desc"
  >("newest");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [isPermanentDeleteAllModalOpen, setIsPermanentDeleteAllModalOpen] =
    useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleSearchTermChange = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const handleCategoryClick = useCallback(
    (category: string) => {
      setSelectedCategories((prev) => {
        let updatedCategories: string[];
        const language = selectedLanguage;

        if (prev.includes(category)) {
          updatedCategories = prev.filter((c) => c !== category);
        } else {
          updatedCategories = [...prev, category];
        }

        // Build URL params properly
        const params: any = {};
        if (updatedCategories.length > 0) {
          params.categories = updatedCategories.join(",");
        }
        if (language) {
          params.language = language;
        }

        setSearchParams(params);

        return updatedCategories;
      });
    },
    [selectedLanguage, setSearchParams]
  );

  const handleLanguageChange = useCallback(
    (language: string) => {
      setSelectedLanguage(language);

      const categories = selectedCategories.join(",");
      const params: any = {};

      if (categories) params.categories = categories;
      if (language) params.language = language;

      setSearchParams(params);
    },
    [selectedCategories, setSearchParams]
  );

  const languages = useMemo(() => {
    const langSet = new Set<string>();
    snippets.forEach((snippet) => {
      snippet.fragments.forEach((fragment) => {
        langSet.add(getLanguageLabel(fragment.language));
      });
    });
    return Array.from(langSet).sort();
  }, [snippets]);

  const allCategories = useMemo(
    () =>
      [...new Set(snippets.flatMap((snippet) => snippet.categories))].sort(),
    [snippets]
  );

  const filteredSnippets = useMemo(() => {
    const result = snippets
      .filter((snippet) => {
        if (showFavorites && snippet.is_favorite !== 1) {
          return false;
        }

        const search = searchTerm.toLowerCase();

        const basicMatch =
          snippet.title.toLowerCase().includes(search) ||
          snippet.description.toLowerCase().includes(search);

        const fragmentMatch = snippet.fragments.some(
          (fragment) =>
            fragment.file_name.toLowerCase().includes(search) ||
            getLanguageLabel(fragment.language)
              .toLowerCase()
              .includes(search) ||
            (includeCodeInSearch &&
              fragment.code.toLowerCase().includes(search))
        );

        const languageMatch =
          selectedLanguage === "" ||
          snippet.fragments.some(
            (fragment) =>
              getLanguageLabel(fragment.language).toLowerCase() ===
              selectedLanguage.toLowerCase()
          );

        const categoryMatch =
          selectedCategories.length === 0 ||
          selectedCategories.every((cat) => snippet.categories.includes(cat));

        return (basicMatch || fragmentMatch) && languageMatch && categoryMatch;
      })
      .sort((a, b) => {
        if (a.is_pinned !== b.is_pinned) {
          return b.is_pinned - a.is_pinned;
        }
        if (a.is_pinned === 1 && b.is_pinned === 1) {
          return (
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          );
        }
        switch (sortOrder) {
          case "newest":
            return (
              new Date(b.updated_at).getTime() -
              new Date(a.updated_at).getTime()
            );
          case "oldest":
            return (
              new Date(a.updated_at).getTime() -
              new Date(b.updated_at).getTime()
            );
          case "alpha-asc":
            return a.title.localeCompare(b.title);
          case "alpha-desc":
            return b.title.localeCompare(a.title);
          default:
            return 0;
        }
      });

    return result;
  }, [
    snippets,
    searchTerm,
    selectedLanguage,
    includeCodeInSearch,
    sortOrder,
    selectedCategories,
    showFavorites,
  ]);

  const openSnippet = useCallback(
    (snippet: Snippet) => setSelectedSnippet(snippet),
    []
  );
  const closeSnippet = useCallback(() => setSelectedSnippet(null), []);

  const openPermanentDeleteAllModal = () => {
    if (snippets.length === 0) {
      addToast("No snippets in the recycle bin to clear.", "info");
      return;
    }
    setIsPermanentDeleteAllModalOpen(true);
  };

  const closePermanentDeleteAllModal = () =>
    setIsPermanentDeleteAllModalOpen(false);

  const handlePermanentDeleteAllConfirm = async () => {
    closePermanentDeleteAllModal();
    if (onPermanentDeleteAll) {
      await onPermanentDeleteAll(snippets);
    }
  };

  useEffect(() => {
    const urlCategories = searchParams.get("categories");
    if (urlCategories) {
      setSelectedCategories(urlCategories.split(","));
    }
  }, [searchParams]);

  useEffect(() => {
    const urlLanguage = searchParams.get("language");
    if (urlLanguage) {
      setSelectedLanguage(urlLanguage);
    }
  }, [searchParams]);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text">
          <div className="relative">
            <h1 className="mb-4 text-4xl font-bold">ByteStash</h1>
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary animate-spin" />
              <span className="text-light-text-secondary dark:text-dark-text-secondary">
                Loading snippets...
              </span>
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text">
      <div className="flex items-start justify-between mb-4">
        <StorageHeader isPublicView={isPublicView} />
        {headerRight}
      </div>

      <SearchAndFilter
        searchTerm={searchTerm}
        setSearchTerm={handleSearchTermChange}
        selectedLanguage={selectedLanguage}
        onLanguageChange={handleLanguageChange}
        languages={languages}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        viewMode={viewMode}
        setViewMode={setViewMode}
        openSettingsModal={onSettingsOpen}
        openNewSnippetModal={onNewSnippet}
        allCategories={allCategories}
        selectedCategories={selectedCategories}
        onCategoryClick={handleCategoryClick}
        hideNewSnippet={isPublicView}
        hideRecycleBin={isRecycleView}
        showFavorites={showFavorites}
        handleShowFavorites={handleShowFavorites}
      />

      {isRecycleView && (
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
                Snippets in the recycle bin will be permanently deleted after 30
                days.
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
      )}

      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            Filtered by categories:
          </span>
          {selectedCategories.map((category, index) => (
            <button
              key={index}
              onClick={() => handleCategoryClick(category)}
              className="flex items-center gap-1 px-2 py-1 text-sm rounded-md bg-light-primary/20 dark:bg-dark-primary/20 text-light-primary dark:text-dark-primary hover:bg-light-primary/30 dark:hover:bg-dark-primary/30"
            >
              <span>{category}</span>
              <span className="text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text dark:hover:text-dark-text">
                ×
              </span>
            </button>
          ))}
        </div>
      )}

      <SnippetList
        snippets={filteredSnippets}
        viewMode={viewMode}
        onOpen={openSnippet}
        onDelete={onDelete || (() => Promise.resolve())}
        onRestore={onRestore || (() => Promise.resolve())}
        onEdit={onEdit || (() => {})}
        onCategoryClick={handleCategoryClick}
        onShare={onShare || (() => {})}
        onDuplicate={onDuplicate || (() => {})}
        compactView={compactView}
        showCodePreview={showCodePreview}
        previewLines={previewLines}
        showCategories={showCategories}
        expandCategories={expandCategories}
        showLineNumbers={showLineNumbers}
        isPublicView={isPublicView}
        isRecycleView={isRecycleView}
        isAuthenticated={isAuthenticated}
        pinSnippet={pinSnippet}
        favoriteSnippet={favoriteSnippet}
      />

      <SnippetModal
        snippet={selectedSnippet}
        isOpen={!!selectedSnippet}
        onClose={closeSnippet}
        onDelete={onDelete}
        onEdit={onEdit}
        onCategoryClick={handleCategoryClick}
        showLineNumbers={showLineNumbers}
        isPublicView={isPublicView}
        isRecycleView={false}
      />

      <ConfirmationModal
        isOpen={isPermanentDeleteAllModalOpen}
        onClose={closePermanentDeleteAllModal}
        onConfirm={handlePermanentDeleteAllConfirm}
        title="Confirm Deletion"
        message={`Are you sure you want to permanently clear all snippets in the recycle bin? This action cannot be undone.`}
        confirmLabel="Delete Permanently"
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default BaseSnippetStorage;
