import { apiClient } from './apiClient';
import type { AuthResponse, AuthConfig } from '../../types/user';
import { API_ENDPOINTS } from '../../constants/api';

export const getAuthConfig = async () => {
  return apiClient.get<AuthConfig>(`${API_ENDPOINTS.AUTH}/config`);
};

export const verifyToken = async () => {
  return apiClient.get<{ valid: boolean; user?: any }>(`${API_ENDPOINTS.AUTH}/verify`, { requiresAuth: true });
};

export const login = async (username: string, password: string): Promise<AuthResponse> => {
  return apiClient.post<AuthResponse>(`${API_ENDPOINTS.AUTH}/login`, { username, password });
};

export const register = async (username: string, password: string): Promise<AuthResponse> => {
  return apiClient.post<AuthResponse>(`${API_ENDPOINTS.AUTH}/register`, { username, password });
};

export const anonymous = async (): Promise<AuthResponse> => {
  return apiClient.post<AuthResponse>(`${API_ENDPOINTS.AUTH}/anonymous`, {});
}
