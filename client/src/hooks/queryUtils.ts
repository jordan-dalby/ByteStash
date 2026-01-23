import { QueryClient, InfiniteData } from '@tanstack/react-query';
import { Snippet } from '../types/snippets';

export interface PaginatedSnippetResponse {
  data: Snippet[];
  pagination: {
    offset: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

type InfiniteSnippetData = InfiniteData<PaginatedSnippetResponse, number>;

export const createOptimisticRemoval = (queryClient: QueryClient) => {
  return async (id: string, queryKey: readonly unknown[]) => {
    await queryClient.cancelQueries({ queryKey });
    const previousData = queryClient.getQueriesData<InfiniteSnippetData>({ queryKey });

    queryClient.setQueriesData<InfiniteSnippetData>(
      { queryKey },
      (old) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.filter((s) => s.id !== id),
            pagination: {
              ...page.pagination,
              total: Math.max(0, page.pagination.total - 1),
            },
          })),
        };
      }
    );

    return { previousData };
  };
};

export const createOptimisticFieldUpdate = (
  queryClient: QueryClient,
  updateFn: (snippet: Snippet) => Partial<Snippet>
) => {
  return async (id: string, queryKey: readonly unknown[]) => {
    await queryClient.cancelQueries({ queryKey });
    const previousData = queryClient.getQueriesData<InfiniteSnippetData>({ queryKey });

    queryClient.setQueriesData<InfiniteSnippetData>(
      { queryKey },
      (old) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.map((s) =>
              s.id === id ? { ...s, ...updateFn(s) } : s
            ),
          })),
        };
      }
    );

    return { previousData };
  };
};

export const createRollbackHandler = (queryClient: QueryClient) => {
  return (context: { previousData?: Array<[readonly unknown[], unknown]> } | undefined) => {
    if (context?.previousData) {
      context.previousData.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    }
  };
};

export const updateSnippetInCache = (
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  updatedSnippet: Snippet
) => {
  queryClient.setQueriesData<InfiniteSnippetData>(
    { queryKey },
    (old) => {
      if (!old?.pages) return old;
      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          data: page.data.map((s) =>
            s.id === updatedSnippet.id ? updatedSnippet : s
          ),
        })),
      };
    }
  );
};
