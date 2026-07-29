import { apiClient } from './apiClient';
import type { UserSettings, UserSettingsResponse } from '../../types/settings';

export const fetchUserSettings = async (): Promise<UserSettingsResponse> =>
  apiClient.get<UserSettingsResponse>('/api/settings', { requiresAuth: true });

export const saveUserSettings = async (
  settings: Partial<UserSettings>
): Promise<UserSettingsResponse> =>
  apiClient.patch<UserSettingsResponse>('/api/settings', { settings }, { requiresAuth: true });

export const resetUserSettings = async (): Promise<UserSettingsResponse> =>
  apiClient.delete<UserSettingsResponse>('/api/settings', { requiresAuth: true });
