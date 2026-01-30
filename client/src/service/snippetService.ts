import { apiClient } from "../utils/api/apiClient";
import { Snippet } from "../types/snippets";
import { API_ENDPOINTS } from "../constants/api";

export const snippetService = {
  async getAllSnippets(): Promise<Snippet[]> {
    // Fetch all snippets using pagination
    const allSnippets: Snippet[] = [];
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      const response = await this.getSnippetsPaginated({ limit, offset });
      allSnippets.push(...response.data);
      hasMore = response.pagination.hasMore;
      offset += limit;
    }

    return allSnippets;
  },

  async getSnippetById(id: string): Promise<Snippet> {
    return apiClient.get<Snippet>(`${API_ENDPOINTS.SNIPPETS}/${id}`, {
      requiresAuth: true,
    });
  },

  async createSnippet(
    snippet: Omit<Snippet, "id" | "updated_at">
  ): Promise<Snippet> {
    return apiClient.post<Snippet>(API_ENDPOINTS.SNIPPETS, snippet, {
      requiresAuth: true,
    });
  },

  async updateSnippet(
    id: string,
    snippet: Omit<Snippet, "id" | "updated_at">
  ): Promise<Snippet> {
    return apiClient.put<Snippet>(`${API_ENDPOINTS.SNIPPETS}/${id}`, snippet, {
      requiresAuth: true,
    });
  },

  async deleteSnippet(id: string): Promise<void> {
    return apiClient.delete(`${API_ENDPOINTS.SNIPPETS}/${id}`, {
      requiresAuth: true,
    });
  },

  async restoreSnippet(id: string): Promise<void> {
    return apiClient.patch(
      `${API_ENDPOINTS.SNIPPETS}/${id}/restore`,
      {},
      { requiresAuth: true }
    );
  },

  async moveToRecycleBin(id: string): Promise<void> {
    return apiClient.patch(
      `${API_ENDPOINTS.SNIPPETS}/${id}/recycle`,
      {},
      { requiresAuth: true }
    );
  },

  async setPinned(id: string, is_pinned: boolean): Promise<Snippet> {
    return apiClient.patch<Snippet>(
      `${API_ENDPOINTS.SNIPPETS}/${id}/pin`,
      { is_pinned },
      { requiresAuth: true }
    );
  },

  async setFavorite(id: string, is_favorite: boolean): Promise<Snippet> {
    return apiClient.patch<Snippet>(
      `${API_ENDPOINTS.SNIPPETS}/${id}/favorite`,
      { is_favorite },
      { requiresAuth: true }
    );
  },

  async getSnippetsPaginated(params: {
    limit?: number;
    offset?: number;
    search?: string;
    searchCode?: boolean;
    language?: string;
    category?: string;  // comma-separated
    favorites?: boolean;
    pinned?: boolean;
    recycled?: boolean;
    sort?: string;
  }): Promise<{
    data: Snippet[];
    pagination: {
      total: number;
      offset: number;
      limit: number;
      hasMore: boolean;
    };
  }> {
    const queryString = new URLSearchParams(
      Object.entries(params)
        .filter(([_, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => [k, String(v)])
    ).toString();

    return apiClient.get<any>(
      `${API_ENDPOINTS.SNIPPETS}${queryString ? '?' + queryString : ''}`,
      { requiresAuth: true }
    );
  },

  async getSnippetsMetadata(): Promise<{
    categories: string[];
    languages: string[];
    counts: { total: number };
  }> {
    return apiClient.get<any>(
      `${API_ENDPOINTS.SNIPPETS}/metadata`,
      { requiresAuth: true }
    );
  },

  async getPublicSnippetsPaginated(params: {
    limit?: number;
    offset?: number;
    search?: string;
    searchCode?: boolean;
    language?: string;
    category?: string;
    sort?: string;
  }): Promise<{
    data: Snippet[];
    pagination: {
      total: number;
      offset: number;
      limit: number;
      hasMore: boolean;
    };
  }> {
    const queryString = new URLSearchParams(
      Object.entries(params)
        .filter(([_, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => [k, String(v)])
    ).toString();

    return apiClient.get<any>(
      `${API_ENDPOINTS.PUBLIC}${queryString ? '?' + queryString : ''}`
    );
  },

  async getPublicSnippetsMetadata(): Promise<{
    categories: string[];
    languages: string[];
    counts: { total: number };
  }> {
    return apiClient.get<any>(
      `${API_ENDPOINTS.PUBLIC}/metadata`
    );
  },
};
