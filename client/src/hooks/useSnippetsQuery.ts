import { useInfiniteQuery, useMutation, useQueryClient, InfiniteData } from '@tanstack/react-query';
import { snippetService } from '../service/snippetService';
import { Snippet } from '../types/snippets';
import {
  createSnippet,
  editSnippet,
  deleteSnippet,
  moveToRecycleBin,
  restoreSnippetById,
  setPinnedSnippet,
  setFavoriteSnippet,
} from '../utils/api/snippets';
import {
  createOptimisticRemoval,
  createOptimisticFieldUpdate,
  createRollbackHandler,
  updateSnippetInCache,
  PaginatedSnippetResponse,
} from './queryUtils';

type InfiniteSnippetData = InfiniteData<PaginatedSnippetResponse, number>;

export interface SnippetFilters {
  search?: string;
  searchCode?: boolean;
  language?: string;
  category?: string;
  favorites?: boolean;
  recycled?: boolean;
  sort?: string;
}

export interface SnippetsQueryKey extends SnippetFilters {
  viewType: 'base' | 'public' | 'recycle';
}

export const snippetKeys = {
  all: ['snippets'] as const,
  lists: () => [...snippetKeys.all, 'list'] as const,
  list: (filters: SnippetsQueryKey) => [...snippetKeys.lists(), filters] as const,
  metadata: (viewType: 'base' | 'public') => [...snippetKeys.all, 'metadata', viewType] as const,
};

export const useSnippetsInfiniteQuery = (filters: SnippetsQueryKey) => {
  return useInfiniteQuery<PaginatedSnippetResponse>({
    queryKey: snippetKeys.list(filters),
    queryFn: async ({ pageParam = 0 }) => {
      const params = {
        offset: pageParam as number,
        limit: 50,
        search: filters.search || '',
        searchCode: filters.searchCode || false,
        language: filters.language || '',
        category: filters.category || '',
        favorites: filters.favorites || false,
        recycled: filters.recycled || false,
        sort: filters.sort || 'newest',
      };

      if (filters.viewType === 'public') {
        return snippetService.getPublicSnippetsPaginated(params);
      }
      return snippetService.getSnippetsPaginated(params);
    },
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.offset + lastPage.pagination.limit
        : undefined;
    },
    initialPageParam: 0,
  });
};

export const useCreateSnippet = () => {
  const queryClient = useQueryClient();
  const rollback = createRollbackHandler(queryClient);

  return useMutation({
    mutationFn: (snippet: Omit<Snippet, 'id' | 'updated_at'>) => createSnippet(snippet),
    onMutate: async (newSnippet) => {
      const queryKey = snippetKeys.lists();
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueriesData({ queryKey });

      const tempId = `temp-${Date.now()}`;
      const tempSnippet: Snippet = {
        ...newSnippet,
        id: tempId,
        updated_at: new Date().toISOString(),
        share_count: 0,
      };

      queryClient.setQueriesData<InfiniteSnippetData>(
        { queryKey },
        (old) => {
          if (!old?.pages || old.pages.length === 0) return old;

          const updatedPages = [...old.pages];
          updatedPages[0] = {
            ...updatedPages[0],
            data: [tempSnippet, ...updatedPages[0].data],
            pagination: {
              ...updatedPages[0].pagination,
              total: updatedPages[0].pagination.total + 1,
            },
          };

          return {
            ...old,
            pages: updatedPages,
          };
        }
      );

      return { previousData, tempId };
    },
    onSuccess: (createdSnippet, _, context) => {
      const queryKey = snippetKeys.lists();

      queryClient.setQueriesData<InfiniteSnippetData>(
        { queryKey },
        (old) => {
          if (!old?.pages) return old;

          const updatedPages = old.pages.map((page, index) => {
            if (index === 0) {
              return {
                ...page,
                data: page.data.map((s) =>
                  s.id === context.tempId ? createdSnippet : s
                ),
              };
            }
            return page;
          });

          return {
            ...old,
            pages: updatedPages,
          };
        }
      );
    },
    onError: (_, __, context) => rollback(context),
  });
};

export const useEditSnippet = () => {
  const queryClient = useQueryClient();
  const rollback = createRollbackHandler(queryClient);

  return useMutation({
    mutationFn: ({ id, snippet }: { id: string; snippet: Omit<Snippet, 'id' | 'updated_at'> }) =>
      editSnippet(id, snippet),
    onMutate: async ({ id, snippet }) => {
      const queryKey = snippetKeys.lists();
      const updateInPlace = createOptimisticFieldUpdate(queryClient, () => ({
        ...snippet,
        updated_at: new Date().toISOString(),
      }));
      return updateInPlace(id, queryKey);
    },
    onSuccess: (updatedSnippet) => {
      updateSnippetInCache(queryClient, snippetKeys.lists(), updatedSnippet);
    },
    onError: (_, __, context) => rollback(context),
  });
};

export const useDeleteSnippet = () => {
  const queryClient = useQueryClient();
  const removeSnippet = createOptimisticRemoval(queryClient);
  const rollback = createRollbackHandler(queryClient);

  return useMutation({
    mutationFn: (id: string) => deleteSnippet(id),
    onMutate: (id) => removeSnippet(id, snippetKeys.lists()),
    onError: (_, __, context) => rollback(context),
  });
};

export const useMoveToRecycleBin = () => {
  const queryClient = useQueryClient();
  const removeSnippet = createOptimisticRemoval(queryClient);
  const rollback = createRollbackHandler(queryClient);

  return useMutation({
    mutationFn: (id: string) => moveToRecycleBin(id),
    onMutate: (id) => removeSnippet(id, snippetKeys.lists()),
    onError: (_, __, context) => rollback(context),
  });
};

export const useRestoreSnippet = () => {
  const queryClient = useQueryClient();
  const removeSnippet = createOptimisticRemoval(queryClient);
  const rollback = createRollbackHandler(queryClient);

  return useMutation({
    mutationFn: (id: string) => restoreSnippetById(id),
    onMutate: (id) => removeSnippet(id, snippetKeys.lists()),
    onError: (_, __, context) => rollback(context),
  });
};

export const usePinSnippet = () => {
  const queryClient = useQueryClient();
  const rollback = createRollbackHandler(queryClient);

  return useMutation({
    mutationFn: ({ id, isPinned }: { id: string; isPinned: boolean }) =>
      setPinnedSnippet(id, !isPinned),
    onMutate: async ({ id, isPinned }) => {
      const queryKey = snippetKeys.lists();
      const updateField = createOptimisticFieldUpdate(queryClient, () => ({
        is_pinned: isPinned ? 0 : 1,
      }));
      return updateField(id, queryKey);
    },
    onSuccess: (updatedSnippet) => {
      updateSnippetInCache(queryClient, snippetKeys.lists(), updatedSnippet);
    },
    onError: (_, __, context) => rollback(context),
  });
};

export const useFavoriteSnippet = () => {
  const queryClient = useQueryClient();
  const rollback = createRollbackHandler(queryClient);

  return useMutation({
    mutationFn: ({ id, isFavorite }: { id: string; isFavorite: boolean }) =>
      setFavoriteSnippet(id, !isFavorite),
    onMutate: async ({ id, isFavorite }) => {
      const queryKey = snippetKeys.lists();
      const updateField = createOptimisticFieldUpdate(queryClient, () => ({
        is_favorite: isFavorite ? 0 : 1,
      }));
      return updateField(id, queryKey);
    },
    onSuccess: (updatedSnippet) => {
      updateSnippetInCache(queryClient, snippetKeys.lists(), updatedSnippet);
    },
    onError: (_, __, context) => rollback(context),
  });
};
