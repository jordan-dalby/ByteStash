import React, {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from './ThemeContext';
import { fetchUserSettings, saveUserSettings } from '../utils/api/settings';
import {
  DEFAULT_SETTINGS,
  normalizeLocale,
  sanitizeSettings,
  type UserSettings,
} from '../types/settings';
import {
  clearLegacySettings,
  clearSettingsCache,
  readLegacySettings,
  readSettingsCache,
  writeSettingsCache,
} from '../utils/settingsStorage';

const SAVE_DEBOUNCE_MS = 500;

interface SettingsContextType {
  settings: UserSettings;
  updateSettings: (partial: Partial<UserSettings>) => void;
  isSettingsLoaded: boolean;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export interface SettingsProviderProps {
  children: React.ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
  const { setTheme } = useTheme();
  const { i18n } = useTranslation();

  const detectedLocaleRef = useRef(normalizeLocale(i18n.language));

  const [settings, setSettings] = useState<UserSettings>(() => {
    const cached = readSettingsCache();
    const stored =
      Object.keys(cached.settings).length > 0 ? cached.settings : readLegacySettings();

    return {
      ...DEFAULT_SETTINGS,
      locale: normalizeLocale(i18n.language),
      ...stored,
    };
  });
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const isAuthenticatedRef = useRef(isAuthenticated);
  isAuthenticatedRef.current = isAuthenticated;

  const setThemeRef = useRef(setTheme);
  setThemeRef.current = setTheme;

  useEffect(() => {
    setThemeRef.current(settings.theme);
  }, [settings.theme]);

  useEffect(() => {
    if (normalizeLocale(i18n.language) !== settings.locale) {
      i18n.changeLanguage(settings.locale);
    }
  }, [settings.locale, i18n]);

  useEffect(() => {
    writeSettingsCache(user?.id ?? null, settings);
  }, [settings, user?.id]);

  const pendingRef = useRef<Partial<UserSettings>>({});
  const timerRef = useRef<number | null>(null);

  const flush = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const pending = pendingRef.current;
    pendingRef.current = {};

    if (!isAuthenticatedRef.current || Object.keys(pending).length === 0) {
      return;
    }

    saveUserSettings(pending).catch((error) => {
      console.error('Failed to save settings:', error);
    });
  }, []);

  const updateSettings = useCallback(
    (partial: Partial<UserSettings>) => {
      const clean = sanitizeSettings(partial);
      if (Object.keys(clean).length === 0) return;

      setSettings((prev) => ({ ...prev, ...clean }));

      if (!isAuthenticatedRef.current) return;

      pendingRef.current = { ...pendingRef.current, ...clean };
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(flush, SAVE_DEBOUNCE_MS);
    },
    [flush]
  );

  useEffect(() => {
    const handlePageHide = () => flush();
    window.addEventListener('pagehide', handlePageHide);
    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      flush();
    };
  }, [flush]);

  const loadedForUserRef = useRef<number | null>(null);

  useEffect(() => {
    if (isAuthLoading) return;

    if (!isAuthenticated || !user) {
      setIsSettingsLoaded(true);
      return;
    }

    if (loadedForUserRef.current === user.id) return;
    loadedForUserRef.current = user.id;

    let cancelled = false;
    let settled = false;

    (async () => {
      try {
        const response = await fetchUserSettings();
        if (cancelled) return;

        if (response.updatedAt === null) {
          await saveUserSettings(settingsRef.current);
        } else {
          setSettings((prev) => ({ ...prev, ...sanitizeSettings(response.settings) }));
        }

        if (!cancelled) clearLegacySettings();
      } catch (error) {
        console.error('Failed to load settings from server:', error);
        loadedForUserRef.current = null;
      } finally {
        settled = true;
        if (!cancelled) setIsSettingsLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
      if (!settled) loadedForUserRef.current = null;
    };
  }, [isAuthLoading, isAuthenticated, user?.id]);

  const wasAuthenticatedRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated) {
      wasAuthenticatedRef.current = true;
      return;
    }

    if (!wasAuthenticatedRef.current) return;
    wasAuthenticatedRef.current = false;

    loadedForUserRef.current = null;
    pendingRef.current = {};
    clearSettingsCache();
    setSettings({ ...DEFAULT_SETTINGS, locale: detectedLocaleRef.current });
  }, [isAuthenticated]);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, isSettingsLoaded }}>
      {children}
    </SettingsContext.Provider>
  );
};
