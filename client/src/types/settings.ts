import { Locale } from '../i18n/types';

export type Theme = 'light' | 'dark' | 'system';
export type ViewMode = 'grid' | 'list';

export interface UserSettings {
  theme: Theme;
  locale: Locale;
  viewMode: ViewMode;
  compactView: boolean;
  showCodePreview: boolean;
  previewLines: number;
  includeCodeInSearch: boolean;
  showCategories: boolean;
  expandCategories: boolean;
  showLineNumbers: boolean;
  showFavorites: boolean;
}

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'system',
  locale: Locale.en,
  viewMode: 'grid',
  compactView: false,
  showCodePreview: true,
  previewLines: 4,
  includeCodeInSearch: false,
  showCategories: true,
  expandCategories: false,
  showLineNumbers: false,
  showFavorites: false,
};

export interface UserSettingsResponse {
  settings: Partial<UserSettings>;
  updatedAt: string | null;
}

const THEMES: Theme[] = ['light', 'dark', 'system'];
const VIEW_MODES: ViewMode[] = ['grid', 'list'];
const LOCALES = Object.values(Locale) as string[];

const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';

const validators: { [K in keyof UserSettings]: (value: unknown) => boolean } = {
  theme: (value) => typeof value === 'string' && THEMES.includes(value as Theme),
  locale: (value) => typeof value === 'string' && LOCALES.includes(value),
  viewMode: (value) => typeof value === 'string' && VIEW_MODES.includes(value as ViewMode),
  compactView: isBoolean,
  showCodePreview: isBoolean,
  previewLines: (value) =>
    typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 20,
  includeCodeInSearch: isBoolean,
  showCategories: isBoolean,
  expandCategories: isBoolean,
  showLineNumbers: isBoolean,
  showFavorites: isBoolean,
};

export const sanitizeSettings = (input: unknown): Partial<UserSettings> => {
  const result: Partial<UserSettings> = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return result;
  }

  for (const [key, value] of Object.entries(input)) {
    const validator = validators[key as keyof UserSettings];
    if (validator && validator(value)) {
      (result as Record<string, unknown>)[key] = value;
    }
  }

  return result;
};

export const normalizeLocale = (language: string | undefined): Locale => {
  const base = (language || '').split('-')[0];
  return LOCALES.includes(base) ? (base as Locale) : DEFAULT_SETTINGS.locale;
};
