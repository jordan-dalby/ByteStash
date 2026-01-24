import { apiClient } from './apiClient';

const BASE_URL = '/api/admin';

// Helper to build query string
const buildQueryString = (params: Record<string, any>): string => {
  const queryString = new URLSearchParams(
    Object.entries(params)
      .filter(([_, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => [k, String(v)])
  ).toString();
  return queryString ? `?${queryString}` : '';
};

export const adminApi = {
  // Dashboard
  getStats: () => apiClient.get<any>(`${BASE_URL}/stats`, { requiresAuth: true }),

  // Users
  getUsers: (params: {
    offset?: number;
    limit?: number;
    search?: string;
    authType?: string;
    isActive?: string;
  } = {}) =>
    apiClient.get<any>(`${BASE_URL}/users${buildQueryString(params)}`, {
      requiresAuth: true,
    }),

  getUserDetails: (id: number) =>
    apiClient.get<any>(`${BASE_URL}/users/${id}`, { requiresAuth: true }),

  deleteUser: (id: number) =>
    apiClient.delete<any>(`${BASE_URL}/users/${id}`, { requiresAuth: true }),

  toggleUserActive: (id: number) =>
    apiClient.patch<any>(`${BASE_URL}/users/${id}/toggle-active`, {}, { requiresAuth: true }),

  // Snippets
  getSnippets: (params: {
    offset?: number;
    limit?: number;
    search?: string;
    userId?: string;
    isPublic?: string;
    language?: string;
    category?: string;
  } = {}) =>
    apiClient.get<any>(`${BASE_URL}/snippets${buildQueryString(params)}`, {
      requiresAuth: true,
    }),

  deleteSnippet: (id: number) =>
    apiClient.delete<any>(`${BASE_URL}/snippets/${id}`, { requiresAuth: true }),

  changeSnippetOwner: (id: number, newUserId: number) =>
    apiClient.patch<any>(
      `${BASE_URL}/snippets/${id}/owner`,
      { newUserId },
      { requiresAuth: true }
    ),

  toggleSnippetPublic: (id: number) =>
    apiClient.patch<any>(`${BASE_URL}/snippets/${id}/toggle-public`, {}, { requiresAuth: true }),

  // API Keys
  getApiKeys: (params: {
    offset?: number;
    limit?: number;
    userId?: string;
  } = {}) =>
    apiClient.get<any>(`${BASE_URL}/api-keys${buildQueryString(params)}`, {
      requiresAuth: true,
    }),

  deleteApiKey: (id: number) =>
    apiClient.delete<any>(`${BASE_URL}/api-keys/${id}`, { requiresAuth: true }),

  // Shares
  getShares: (params: {
    offset?: number;
    limit?: number;
    userId?: string;
    requiresAuth?: string;
  } = {}) =>
    apiClient.get<any>(`${BASE_URL}/shares${buildQueryString(params)}`, {
      requiresAuth: true,
    }),

  deleteShare: (id: string) =>
    apiClient.delete<any>(`${BASE_URL}/shares/${id}`, { requiresAuth: true }),
};
