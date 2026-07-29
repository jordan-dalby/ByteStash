import { sanitizeSettings, type UserSettings } from '../types/settings';

const CACHE_KEY = 'bytestash:settings';

const LEGACY_BOOLEAN_KEYS = [
  'compactView',
  'includeCodeInSearch',
  'expandCategories',
  'showLineNumbers',
  'showFavorites',
] as const;

const LEGACY_BOOLEAN_KEYS_DEFAULT_TRUE = ['showCodePreview', 'showCategories'] as const;

const LEGACY_KEYS = [
  ...LEGACY_BOOLEAN_KEYS,
  ...LEGACY_BOOLEAN_KEYS_DEFAULT_TRUE,
  'viewMode',
  'previewLines',
];

export interface SettingsCache {
  userId: number | null;
  settings: Partial<UserSettings>;
}

const EMPTY_CACHE: SettingsCache = { userId: null, settings: {} };

export const readSettingsCache = (): SettingsCache => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return EMPTY_CACHE;

    const parsed = JSON.parse(raw);
    return {
      userId: typeof parsed?.userId === 'number' ? parsed.userId : null,
      settings: sanitizeSettings(parsed?.settings),
    };
  } catch {
    return EMPTY_CACHE;
  }
};

export const writeSettingsCache = (userId: number | null, settings: Partial<UserSettings>): void => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ userId, settings }));
  } catch (error) {
    console.warn('Failed to cache settings locally:', error);
  }
};

export const clearSettingsCache = (): void => {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {}
};

export const readLegacySettings = (): Partial<UserSettings> => {
  const settings: Record<string, unknown> = {};

  try {
    for (const key of LEGACY_BOOLEAN_KEYS) {
      const value = localStorage.getItem(key);
      if (value !== null) settings[key] = value === 'true';
    }

    for (const key of LEGACY_BOOLEAN_KEYS_DEFAULT_TRUE) {
      const value = localStorage.getItem(key);
      if (value !== null) settings[key] = value !== 'false';
    }

    const viewMode = localStorage.getItem('viewMode');
    if (viewMode !== null) settings.viewMode = viewMode;

    const previewLines = localStorage.getItem('previewLines');
    if (previewLines !== null) settings.previewLines = parseInt(previewLines, 10);

    const theme = localStorage.getItem('theme');
    if (theme !== null) settings.theme = theme;
  } catch {
    return {};
  }

  return sanitizeSettings(settings);
};

export const clearLegacySettings = (): void => {
  try {
    LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
  } catch {}
};
