import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Snippet } from "../types/snippets";
import { snippetService } from "../service/snippetService";
import { useAuth } from "./useAuth";
import { useToast } from "./useToast";

interface PaginationState {
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}

interface SnippetFilters {
  search: string;
  language: string;
  categories: string[];
  sort: string;
}

interface UseSnippetPaginationOptions {
  filters: SnippetFilters;
  includeCodeInSearch: boolean;
  showFavorites?: boolean;
  viewType: "base" | "public" | "recycle";
  forceReload?: number;
}

interface UseSnippetPaginationReturn {
  snippets: Snippet[];
  setSnippets: React.Dispatch<React.SetStateAction<Snippet[]>>;
  pagination: PaginationState;
  isLoading: boolean;
  isLoadingMore: boolean;
  selectedSnippet: Snippet | null;
  setSelectedSnippet: (snippet: Snippet | null) => void;
  observerTarget: React.RefObject<HTMLDivElement>;
  loadSnippets: (append?: boolean) => Promise<void>;
}

export const useSnippetPagination = ({
  filters,
  includeCodeInSearch,
  showFavorites = false,
  viewType,
  forceReload = 0,
}: UseSnippetPaginationOptions): UseSnippetPaginationReturn => {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const { addToast } = useToast();

  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    total: 0,
    offset: 0,
    limit: 50,
    hasMore: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(null);

  const mountedRef = useRef(false);
  const snippetsRef = useRef<Snippet[]>([]);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    snippetsRef.current = snippets;
  }, [snippets]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const apiFilters = useMemo(() => {
    const baseFilters = {
      search: filters.search,
      searchCode: includeCodeInSearch,
      language: filters.language,
      category: filters.categories.join(","),
      sort: filters.sort,
    };

    if (viewType === "base") {
      return {
        ...baseFilters,
        favorites: showFavorites,
        recycled: false,
      };
    } else if (viewType === "recycle") {
      return {
        ...baseFilters,
        favorites: false,
        recycled: true,
      };
    }

    return baseFilters;
  }, [filters, includeCodeInSearch, showFavorites, viewType]);

  const loadSnippets = useCallback(
    async (append = false) => {
      try {
        if (append) {
          setIsLoadingMore(true);
        } else {
          setIsLoading(true);
          setSnippets([]);
        }

        const offset = append ? snippetsRef.current.length : 0;
        const params = {
          offset,
          limit: 50,
          ...apiFilters,
        };

        const result =
          viewType === "public"
            ? await snippetService.getPublicSnippetsPaginated(params)
            : await snippetService.getSnippetsPaginated(params);

        if (mountedRef.current) {
          if (append) {
            setSnippets((prev) => [...prev, ...result.data]);
          } else {
            setSnippets(result.data);
          }
          setPagination(result.pagination);
        }
      } catch (error: any) {
        console.error("Failed to load snippets:", error);
        if (mountedRef.current) {
          if (viewType !== "public" && (error.status === 401 || error.status === 403)) {
            logout();
            addToast(t('pagination.useSnippetPagination.error.sessionExpired'), "error");
          } else {
            addToast(t('pagination.useSnippetPagination.error.failedSnippetsLoad'), "error");
          }
        }
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
          setIsLoadingMore(false);
        }
      }
    },
    [apiFilters, viewType, addToast, logout]
  );

  useEffect(() => {
    loadSnippets(false);
  }, [loadSnippets, forceReload]);

  const loadMore = useCallback(() => {
    if (pagination.hasMore && !isLoadingMore) {
      loadSnippets(true);
    }
  }, [pagination.hasMore, isLoadingMore, loadSnippets]);

  useEffect(() => {
    if (!pagination) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && pagination.hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [pagination, isLoadingMore, loadMore]);

  return {
    snippets,
    setSnippets,
    pagination,
    isLoading,
    isLoadingMore,
    selectedSnippet,
    setSelectedSnippet,
    observerTarget,
    loadSnippets,
  };
};
