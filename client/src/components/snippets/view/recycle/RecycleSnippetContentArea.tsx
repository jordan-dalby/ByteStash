import React, { useEffect, useCallback, useMemo, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Snippet } from "../../../../types/snippets";
import { useAuth } from "../../../../hooks/useAuth";
import { useToast } from "../../../../hooks/useToast";
import {
  useSnippetsInfiniteQuery,
  useDeleteSnippet,
  useRestoreSnippet,
  SnippetsQueryKey,
} from "../../../../hooks/useSnippetsQuery";
import SnippetList from "../../list/SnippetList";
import SnippetModal from "../SnippetModal";
import { PageContainer } from "../../../common/layout/PageContainer";

interface RecycleSnippetContentAreaProps {
  includeCodeInSearch: boolean;
  viewMode: "grid" | "list";
  compactView: boolean;
  showCodePreview: boolean;
  previewLines: number;
  showCategories: boolean;
  expandCategories: boolean;
  showLineNumbers: boolean;
  isAuthenticated: boolean;
  onCategoryClick: (category: string) => void;
  onSnippetsChange?: (snippets: Snippet[]) => void;
}

const RecycleSnippetContentArea: React.FC<RecycleSnippetContentAreaProps> = ({
  includeCodeInSearch,
  viewMode,
  compactView,
  showCodePreview,
  previewLines,
  showCategories,
  expandCategories,
  showLineNumbers,
  isAuthenticated,
  onCategoryClick,
  onSnippetsChange,
}) => {
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  const queryFilters: SnippetsQueryKey = useMemo(() => ({
    search: searchParams.get("search") || undefined,
    searchCode: includeCodeInSearch,
    language: searchParams.get("language") || undefined,
    category: searchParams.get("categories") || undefined,
    favorites: false,
    recycled: true,
    sort: searchParams.get("sort") || "newest",
    viewType: "recycle",
  }), [searchParams, includeCodeInSearch]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useSnippetsInfiniteQuery(queryFilters);

  const deleteSnippetMutation = useDeleteSnippet();
  const restoreSnippetMutation = useRestoreSnippet();

  const snippets = useMemo(() => {
    return data?.pages.flatMap(page => page.data) ?? [];
  }, [data]);

  // Notify parent when snippets change (for bulk delete)
  useEffect(() => {
    if (onSnippetsChange) {
      onSnippetsChange(snippets);
    }
  }, [snippets, onSnippetsChange]);

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

  const permanentDeleteSnippet = useCallback(async (id: string) => {
    try {
      await deleteSnippetMutation.mutateAsync(id);
      addToast("Snippet deleted successfully", "success");
    } catch (error: any) {
      console.error("Failed to delete snippet:", error);
      if (error.status === 401 || error.status === 403) {
        logout();
        addToast("Session expired. Please login again.", "error");
      } else {
        addToast("Failed to delete snippet. Please try again.", "error");
      }
    }
  }, [deleteSnippetMutation, addToast, logout]);

  const restoreSnippet = useCallback(async (id: string) => {
    try {
      await restoreSnippetMutation.mutateAsync(id);
      addToast("Snippet restored successfully", "success");
      navigate("/");
    } catch (error: any) {
      console.error("Failed to restore snippet:", error);
      if (error.status === 401 || error.status === 403) {
        logout();
        addToast("Session expired. Please login again.", "error");
      } else {
        addToast("Failed to restore snippet. Please try again.", "error");
      }
    }
  }, [restoreSnippetMutation, addToast, logout, navigate]);

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
        onOpen={setSelectedSnippet}
        onDelete={permanentDeleteSnippet}
        onRestore={restoreSnippet}
        onEdit={() => {}}
        onCategoryClick={onCategoryClick}
        onShare={() => {}}
        onDuplicate={() => {}}
        compactView={compactView}
        showCodePreview={showCodePreview}
        previewLines={previewLines}
        showCategories={showCategories}
        expandCategories={expandCategories}
        showLineNumbers={showLineNumbers}
        isPublicView={false}
        isRecycleView={true}
        isAuthenticated={isAuthenticated}
      />

      {hasNextPage && (
        <div ref={observerTarget} className="h-20 flex items-center justify-center">
          {isFetchingNextPage && <Loader2 className="animate-spin" />}
        </div>
      )}

      <SnippetModal
        snippet={selectedSnippet}
        isOpen={!!selectedSnippet}
        onClose={() => setSelectedSnippet(null)}
        onDelete={permanentDeleteSnippet}
        onEdit={() => {}}
        onCategoryClick={onCategoryClick}
        showLineNumbers={showLineNumbers}
        isPublicView={false}
        isRecycleView={true}
      />
    </>
  );
};

export default RecycleSnippetContentArea;
