import React, { useEffect, useCallback, useMemo, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Snippet } from "../../../../types/snippets";
import { useAuth } from "../../../../hooks/useAuth";
import { useToast } from "../../../../hooks/useToast";
import {
  useSnippetsInfiniteQuery,
  useMoveToRecycleBin,
  usePinSnippet,
  useFavoriteSnippet,
  useCreateSnippet,
  SnippetsQueryKey,
} from "../../../../hooks/useSnippetsQuery";
import SnippetList from "../../list/SnippetList";
import SnippetModal from "../SnippetModal";
import { PageContainer } from "../../../common/layout/PageContainer";
import { saveLanguagesUsage } from "../../../../utils/language/languageUtils";

interface SnippetContentAreaProps {
  includeCodeInSearch: boolean;
  showFavorites: boolean;
  viewMode: "grid" | "list";
  compactView: boolean;
  showCodePreview: boolean;
  previewLines: number;
  showCategories: boolean;
  expandCategories: boolean;
  showLineNumbers: boolean;
  isAuthenticated: boolean;
  onCategoryClick: (category: string) => void;
  onSnippetSelect: (snippet: Snippet | null) => void;
  onEdit: (snippet: Snippet) => void;
  onShare: (snippet: Snippet) => void;
}

const SnippetContentArea: React.FC<SnippetContentAreaProps> = ({
  includeCodeInSearch,
  showFavorites,
  viewMode,
  compactView,
  showCodePreview,
  previewLines,
  showCategories,
  expandCategories,
  showLineNumbers,
  isAuthenticated,
  onCategoryClick,
  onSnippetSelect,
  onEdit,
  onShare,
}) => {
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();
  const { logout } = useAuth();
  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  const queryFilters: SnippetsQueryKey = useMemo(() => ({
    search: searchParams.get("search") || undefined,
    searchCode: includeCodeInSearch,
    language: searchParams.get("language") || undefined,
    category: searchParams.get("categories") || undefined,
    favorites: showFavorites,
    recycled: false,
    sort: searchParams.get("sort") || "newest",
    viewType: "base",
  }), [searchParams, includeCodeInSearch, showFavorites]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useSnippetsInfiniteQuery(queryFilters);

  const moveToRecycleBinMutation = useMoveToRecycleBin();
  const pinSnippetMutation = usePinSnippet();
  const favoriteSnippetMutation = useFavoriteSnippet();
  const createSnippetMutation = useCreateSnippet();

  const snippets = useMemo(() => {
    return data?.pages.flatMap(page => page.data) ?? [];
  }, [data]);

  useEffect(() => {
    if (snippets.length > 0) {
      saveLanguagesUsage(snippets);
    }
  }, [snippets]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    if (isError && error) {
      const err = error as any;
      if (err.status === 401 || err.status === 403) {
        logout();
        addToast("Session expired. Please login again.", "error");
      } else {
        addToast("Failed to load snippets", "error");
      }
    }
  }, [isError, error, logout, addToast]);

  const removeSnippet = useCallback(async (id: string) => {
    try {
      await moveToRecycleBinMutation.mutateAsync(id);
      addToast("Snippet moved to recycle bin successfully", "success");
    } catch (error: any) {
      console.error("Failed to move snippet to recycle bin:", error);
      if (error.status === 401 || error.status === 403) {
        logout();
        addToast("Session expired. Please login again.", "error");
      } else {
        addToast("Failed to move snippet to recycle bin. Please try again.", "error");
      }
      throw error;
    }
  }, [moveToRecycleBinMutation, addToast, logout]);

  const pinSnippet = useCallback(async (id: string, isPinned: boolean) => {
    try {
      const updatedSnippet = await pinSnippetMutation.mutateAsync({ id, isPinned });
      addToast(`Snippet ${!isPinned ? "pinned" : "unpinned"} successfully`, "success");
      return updatedSnippet;
    } catch (error: any) {
      console.error("Failed to update pin status:", error);
      if (error.status === 401 || error.status === 403) {
        logout();
        addToast("Session expired. Please login again.", "error");
      } else {
        addToast("Failed to update pin status. Please try again.", "error");
      }
    }
  }, [pinSnippetMutation, addToast, logout]);

  const favoriteSnippet = useCallback(async (id: string, isFavorite: boolean) => {
    try {
      const updatedSnippet = await favoriteSnippetMutation.mutateAsync({ id, isFavorite });
      addToast(`Snippet ${!isFavorite ? "added to" : "removed from"} favorites successfully`, "success");
      return updatedSnippet;
    } catch (error: any) {
      console.error("Failed to update favorite status:", error);
      if (error.status === 401 || error.status === 403) {
        logout();
        addToast("Session expired. Please login again.", "error");
      } else {
        addToast("Failed to update favorite status. Please try again.", "error");
      }
    }
  }, [favoriteSnippetMutation, addToast, logout]);

  const handleDuplicate = useCallback(async (snippet: Snippet) => {
    try {
      const duplicatedSnippet: Omit<Snippet, "id" | "updated_at" | "share_count"> = {
        title: `${snippet.title}`,
        description: snippet.description,
        categories: [...snippet.categories],
        fragments: snippet.fragments.map((f) => ({ ...f })),
        is_public: snippet.is_public,
        is_pinned: 0,
        is_favorite: 0,
      };
      await createSnippetMutation.mutateAsync(duplicatedSnippet);
      addToast("Snippet duplicated successfully", "success");
    } catch (error: any) {
      console.error("Failed to duplicate snippet:", error);
      if (error.status === 401 || error.status === 403) {
        logout();
        addToast("Session expired. Please login again.", "error");
      } else {
        addToast("Failed to duplicate snippet", "error");
      }
    }
  }, [createSnippetMutation, addToast, logout]);

  const handleSnippetSelect = useCallback((snippet: Snippet | null) => {
    setSelectedSnippet(snippet);
    onSnippetSelect(snippet);
  }, [onSnippetSelect]);

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

  const filters = {
    categories: searchParams.get("categories")?.split(",").filter(Boolean) || [],
  };

  return (
    <>
      {filters.categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            Filtered by categories:
          </span>
          {filters.categories.map((category, index) => (
            <button
              key={index}
              onClick={() => onCategoryClick(category)}
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
        snippets={snippets}
        viewMode={viewMode}
        onOpen={handleSnippetSelect}
        onDelete={removeSnippet}
        onRestore={() => Promise.resolve()}
        onEdit={onEdit}
        onCategoryClick={onCategoryClick}
        onShare={onShare}
        onDuplicate={handleDuplicate}
        compactView={compactView}
        showCodePreview={showCodePreview}
        previewLines={previewLines}
        showCategories={showCategories}
        expandCategories={expandCategories}
        showLineNumbers={showLineNumbers}
        isPublicView={false}
        isRecycleView={false}
        isAuthenticated={isAuthenticated}
        pinSnippet={pinSnippet}
        favoriteSnippet={favoriteSnippet}
      />

      {hasNextPage && (
        <div ref={observerTarget} className="h-20 flex items-center justify-center">
          {isFetchingNextPage && <Loader2 className="animate-spin" />}
        </div>
      )}

      <SnippetModal
        snippet={selectedSnippet}
        isOpen={!!selectedSnippet}
        onClose={() => handleSnippetSelect(null)}
        onDelete={removeSnippet}
        onEdit={onEdit}
        onCategoryClick={onCategoryClick}
        showLineNumbers={showLineNumbers}
        isPublicView={false}
        isRecycleView={false}
      />
    </>
  );
};

export default SnippetContentArea;
