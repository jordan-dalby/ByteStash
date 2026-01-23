import React, { useEffect, useCallback, useMemo, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Snippet } from "../../../../types/snippets";
import { useToast } from "../../../../hooks/useToast";
import {
  useSnippetsInfiniteQuery,
  useCreateSnippet,
  SnippetsQueryKey,
} from "../../../../hooks/useSnippetsQuery";
import SnippetList from "../../list/SnippetList";
import SnippetModal from "../SnippetModal";
import { PageContainer } from "../../../common/layout/PageContainer";
import { ROUTES } from "../../../../constants/routes";

interface PublicSnippetContentAreaProps {
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
}

const PublicSnippetContentArea: React.FC<PublicSnippetContentAreaProps> = ({
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
}) => {
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  const queryFilters: SnippetsQueryKey = useMemo(() => ({
    search: searchParams.get("search") || undefined,
    searchCode: includeCodeInSearch,
    language: searchParams.get("language") || undefined,
    category: searchParams.get("categories") || undefined,
    sort: searchParams.get("sort") || "newest",
    viewType: "public",
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

  const createSnippetMutation = useCreateSnippet();

  const snippets = useMemo(() => {
    return data?.pages.flatMap(page => page.data) ?? [];
  }, [data]);

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
      addToast("Failed to load public snippets", "error");
    }
  }, [isError, error, addToast]);

  const handleDuplicate = useCallback(async (snippet: Snippet) => {
    if (!isAuthenticated) {
      addToast("Please sign in to add this snippet to your collection", "info");
      navigate(ROUTES.LOGIN);
      return;
    }

    try {
      const duplicatedSnippet: Omit<Snippet, "id" | "updated_at" | "share_count" | "username"> = {
        title: `${snippet.title}`,
        description: snippet.description,
        categories: [...snippet.categories],
        fragments: snippet.fragments.map((f) => ({ ...f })),
        is_public: 0,
        is_pinned: 0,
        is_favorite: 0,
      };

      await createSnippetMutation.mutateAsync(duplicatedSnippet);
      addToast("Snippet added to your collection", "success");
    } catch (error) {
      console.error("Failed to duplicate snippet:", error);
      addToast("Failed to add snippet to your collection", "error");
    }
  }, [isAuthenticated, createSnippetMutation, addToast, navigate]);

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
        onDelete={() => Promise.resolve()}
        onRestore={() => Promise.resolve()}
        onEdit={() => {}}
        onCategoryClick={onCategoryClick}
        onShare={() => {}}
        onDuplicate={handleDuplicate}
        compactView={compactView}
        showCodePreview={showCodePreview}
        previewLines={previewLines}
        showCategories={showCategories}
        expandCategories={expandCategories}
        showLineNumbers={showLineNumbers}
        isPublicView={true}
        isRecycleView={false}
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
        onDelete={() => Promise.resolve()}
        onEdit={() => {}}
        onCategoryClick={onCategoryClick}
        showLineNumbers={showLineNumbers}
        isPublicView={true}
        isRecycleView={false}
      />
    </>
  );
};

export default PublicSnippetContentArea;
