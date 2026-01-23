import { useSearchParams } from "react-router-dom";
import { useCallback, useMemo } from "react";

export type SortOrder = "newest" | "oldest" | "alpha-asc" | "alpha-desc";

export interface SnippetFilters {
  search: string;
  language: string;
  categories: string[];
  sort: SortOrder;
  favorites: boolean;
  recycled: boolean;
}

export interface SnippetFiltersActions {
  setSearch: (search: string) => void;
  setLanguage: (language: string) => void;
  setCategories: (categories: string[]) => void;
  toggleCategory: (category: string) => void;
  setSort: (sort: SortOrder) => void;
  setFavorites: (favorites: boolean) => void;
  clearFilters: () => void;
}

/**
 * Hook to manage snippet filters via URL search params.
 * All filter state lives in the URL, making it shareable and preventing re-render issues.
 */
export const useSnippetFilters = (defaultRecycled: boolean = false): [SnippetFilters, SnippetFiltersActions] => {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: SnippetFilters = useMemo(() => ({
    search: searchParams.get("search") || "",
    language: searchParams.get("language") || "",
    categories: searchParams.get("categories")?.split(",").filter(Boolean) || [],
    sort: (searchParams.get("sort") as SortOrder) || "newest",
    favorites: searchParams.get("favorites") === "true",
    recycled: defaultRecycled,
  }), [searchParams, defaultRecycled]);

  const updateParams = useCallback((updates: Partial<Record<string, string | null>>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "" || value === undefined) {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      });

      return next;
    });
  }, [setSearchParams]);

  const actions: SnippetFiltersActions = useMemo(() => ({
    setSearch: (search: string) => {
      updateParams({ search: search || null });
    },

    setLanguage: (language: string) => {
      updateParams({ language: language || null });
    },

    setCategories: (categories: string[]) => {
      updateParams({ categories: categories.length > 0 ? categories.join(",") : null });
    },

    toggleCategory: (category: string) => {
      const current = filters.categories;
      const updated = current.includes(category)
        ? current.filter(c => c !== category)
        : [...current, category];

      updateParams({ categories: updated.length > 0 ? updated.join(",") : null });
    },

    setSort: (sort: SortOrder) => {
      updateParams({ sort });
    },

    setFavorites: (favorites: boolean) => {
      updateParams({ favorites: favorites ? "true" : null });
    },

    clearFilters: () => {
      setSearchParams({});
    },
  }), [filters.categories, updateParams, setSearchParams]);

  return [filters, actions];
};
