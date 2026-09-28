export const DEFAULT_SETTINGS = {
  viewMode: 'grid',
  compactView: false,
  showCodePreview: true,
  previewLines: 4,
  includeCodeInSearch: false,
  showCategories: true,
  expandCategories: false,
  showLineNumbers: true,
  theme: 'system',
} as const;

export const APP_VERSION = import.meta.env.VITE_APP_VERSION || 'dev';
