import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/ThemeContext";
import { Locale } from "../i18n/types";

type Theme = "light" | "dark" | "system";

interface Settings {
  compactView: boolean;
  showCodePreview: boolean;
  previewLines: number;
  includeCodeInSearch: boolean;
  showCategories: boolean;
  expandCategories: boolean;
  showLineNumbers: boolean;
  theme: Theme;
  locale: Locale;
  showFavorites?: boolean;
}

export const useSettings = () => {
  const { i18n } = useTranslation();

  const changeLocale = (locale: Locale) => {
    i18n.changeLanguage(locale);
  };

  const { setTheme: setThemeContext } = useTheme();
  const [viewMode, setViewMode] = useState<"grid" | "list">(
    () => (localStorage.getItem("viewMode") as "grid" | "list") || "grid"
  );
  const [compactView, setCompactView] = useState(
    () => localStorage.getItem("compactView") === "true"
  );
  const [showCodePreview, setShowCodePreview] = useState(
    () => localStorage.getItem("showCodePreview") !== "false"
  );
  const [previewLines, setPreviewLines] = useState(() =>
    parseInt(localStorage.getItem("previewLines") || "4", 10)
  );
  const [includeCodeInSearch, setIncludeCodeInSearch] = useState(
    () => localStorage.getItem("includeCodeInSearch") === "true"
  );
  const [showCategories, setShowCategories] = useState(
    () => localStorage.getItem("showCategories") !== "false"
  );
  const [expandCategories, setExpandCategories] = useState(
    () => localStorage.getItem("expandCategories") === "true"
  );
  const [showLineNumbers, setShowLineNumbers] = useState(
    () => localStorage.getItem("showLineNumbers") === "true"
  );
  const [showFavorites, setShowFavorites] = useState(
    () => localStorage.getItem("showFavorites") === "true"
  );
  const [theme, setThemeState] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme === "light" ||
      savedTheme === "dark" ||
      savedTheme === "system"
      ? savedTheme
      : "system";
  });
  const [locale, setLocale] = useState<Locale>(
    () => i18n.language as Locale
  );

  useEffect(() => {
    localStorage.setItem("viewMode", viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem("compactView", compactView.toString());
  }, [compactView]);

  useEffect(() => {
    localStorage.setItem("showCodePreview", showCodePreview.toString());
  }, [showCodePreview]);

  useEffect(() => {
    localStorage.setItem("previewLines", previewLines.toString());
  }, [previewLines]);

  useEffect(() => {
    localStorage.setItem("includeCodeInSearch", includeCodeInSearch.toString());
  }, [includeCodeInSearch]);

  useEffect(() => {
    localStorage.setItem("showCategories", showCategories.toString());
  }, [showCategories]);

  useEffect(() => {
    localStorage.setItem("expandCategories", expandCategories.toString());
  }, [expandCategories]);

  useEffect(() => {
    localStorage.setItem("showLineNumbers", showLineNumbers.toString());
  }, [showLineNumbers]);

  useEffect(() => {
    localStorage.setItem("showFavorites", showFavorites.toString());
  }, [showFavorites]);

  useEffect(() => {
    localStorage.setItem("theme", theme);
    setThemeContext(theme);
  }, [theme, setThemeContext]);

  useEffect(() => {
    changeLocale(locale);
  }, [locale, setLocale]);

  const updateSettings = (newSettings: Settings) => {
    setCompactView(newSettings.compactView);
    setShowCodePreview(newSettings.showCodePreview);
    setPreviewLines(newSettings.previewLines);
    setIncludeCodeInSearch(newSettings.includeCodeInSearch);
    setShowCategories(newSettings.showCategories);
    setExpandCategories(newSettings.expandCategories);
    setShowLineNumbers(newSettings.showLineNumbers);
    if (newSettings.showFavorites) {
      setShowFavorites(newSettings.showFavorites);
    }
    setThemeState(newSettings.theme);
    setLocale(newSettings.locale)
  };

  return {
    viewMode,
    setViewMode,
    compactView,
    showCodePreview,
    previewLines,
    includeCodeInSearch,
    showCategories,
    expandCategories,
    updateSettings,
    showLineNumbers,
    showFavorites,
    setShowFavorites,
    theme,
    locale,
  };
};
