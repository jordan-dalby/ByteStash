import { useCallback, useContext, useRef, type Dispatch, type SetStateAction } from "react";
import { SettingsContext } from "../contexts/SettingsContext";
import type { UserSettings, ViewMode } from "../types/settings";

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }

  const { settings, updateSettings, isSettingsLoaded } = context;

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const setViewMode = useCallback(
    (mode: ViewMode) => updateSettings({ viewMode: mode }),
    [updateSettings]
  );

  const setShowFavorites: Dispatch<SetStateAction<boolean>> = useCallback(
    (value) => {
      const next =
        typeof value === "function" ? value(settingsRef.current.showFavorites) : value;
      updateSettings({ showFavorites: next });
    },
    [updateSettings]
  );

  return {
    viewMode: settings.viewMode,
    setViewMode,
    compactView: settings.compactView,
    showCodePreview: settings.showCodePreview,
    previewLines: settings.previewLines,
    includeCodeInSearch: settings.includeCodeInSearch,
    showCategories: settings.showCategories,
    expandCategories: settings.expandCategories,
    showLineNumbers: settings.showLineNumbers,
    showFavorites: settings.showFavorites,
    setShowFavorites,
    theme: settings.theme,
    locale: settings.locale,
    updateSettings: updateSettings as (newSettings: Partial<UserSettings>) => void,
    isSettingsLoaded,
  };
};
