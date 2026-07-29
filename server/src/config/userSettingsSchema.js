const THEMES = ['light', 'dark', 'system'];
const LOCALES = ['en', 'ru', 'es', 'ja', 'zh', 'it'];
const VIEW_MODES = ['grid', 'list'];

const isBoolean = (value) => typeof value === 'boolean';
const oneOf = (allowed) => (value) => typeof value === 'string' && allowed.includes(value);
const isIntBetween = (min, max) => (value) =>
  typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;

export const USER_SETTINGS_SCHEMA = {
  theme: oneOf(THEMES),
  locale: oneOf(LOCALES),
  viewMode: oneOf(VIEW_MODES),
  compactView: isBoolean,
  showCodePreview: isBoolean,
  previewLines: isIntBetween(1, 20),
  includeCodeInSearch: isBoolean,
  showCategories: isBoolean,
  expandCategories: isBoolean,
  showLineNumbers: isBoolean,
  showFavorites: isBoolean,
};

export const USER_SETTINGS_KEYS = Object.keys(USER_SETTINGS_SCHEMA);

export function validateUserSettings(input) {
  const settings = {};
  const invalidKeys = [];

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { settings, invalidKeys };
  }

  for (const [key, value] of Object.entries(input)) {
    const validator = USER_SETTINGS_SCHEMA[key];
    if (!validator) {
      continue;
    }

    if (validator(value)) {
      settings[key] = value;
    } else {
      invalidKeys.push(key);
    }
  }

  return { settings, invalidKeys };
}
