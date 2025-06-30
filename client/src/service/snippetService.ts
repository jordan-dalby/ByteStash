import { apiClient } from '../utils/api/apiClient';
import { Snippet } from '../types/snippets';
import { API_ENDPOINTS } from '../constants/api';

export const snippetService = {
  async getAllSnippets(): Promise<Snippet[]> {
    return apiClient.get<Snippet[]>(API_ENDPOINTS.SNIPPETS, { requiresAuth: true });
  },

  async getSnippetById(id: string): Promise<Snippet> {
    return apiClient.get<Snippet>(`${API_ENDPOINTS.SNIPPETS}/${id}`, { requiresAuth: true });
  },

  async createSnippet(snippet: Omit<Snippet, 'id' | 'updated_at'>): Promise<Snippet> {
    return apiClient.post<Snippet>(API_ENDPOINTS.SNIPPETS, snippet, { requiresAuth: true });
  },

  async updateSnippet(id: string, snippet: Omit<Snippet, 'id' | 'updated_at'>): Promise<Snippet> {
    return apiClient.put<Snippet>(`${API_ENDPOINTS.SNIPPETS}/${id}`, snippet, { requiresAuth: true });
  },

  async deleteSnippet(id: string): Promise<void> {
    return apiClient.delete(`${API_ENDPOINTS.SNIPPETS}/${id}`, { requiresAuth: true });
  },

  async getRecycleSnippets(): Promise<Snippet[]> {
    return apiClient.get(`${API_ENDPOINTS.SNIPPETS}/recycled`, { requiresAuth: true });
  },

  async restoreSnippet(id: string): Promise<void> {
    return apiClient.patch(`${API_ENDPOINTS.SNIPPETS}/${id}/restore`, {}, { requiresAuth: true });
  },

  async moveToRecycleBin(id: string): Promise<void> {
    return apiClient.patch(`${API_ENDPOINTS.SNIPPETS}/${id}/recycle`, {}, { requiresAuth: true });
  }
};
