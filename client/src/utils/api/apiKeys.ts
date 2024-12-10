import { ApiKey, CreateApiKeyRequest, CreateApiKeyResponse } from '../../types/apiKey';
import { apiClient } from './apiClient';

export const getApiKeys = async (): Promise<ApiKey[]> => {
  return apiClient.get<ApiKey[]>('/api/keys', { requiresAuth: true });
};

export const createApiKey = async (request: CreateApiKeyRequest): Promise<CreateApiKeyResponse> => {
  return apiClient.post<CreateApiKeyResponse>('/api/keys', request, { requiresAuth: true });
};

export const deleteApiKey = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/keys/${id}`, { requiresAuth: true });
};
