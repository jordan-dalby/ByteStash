import { defineConfig } from 'i18next-cli'
import { DEFAULT_LOCALE } from './src/i18n/constants';
import { Locale } from './src/i18n/types';

export default defineConfig({
  locales: [
    Locale.en,
    Locale.ru,
    Locale.es,
    Locale.ja,
    Locale.zh,
  ],
  extract: {
    input: 'src/**/*.{js,jsx,ts,tsx}',
    output: 'src/i18n/locales/{{language}}/{{namespace}}.json',
    primaryLanguage: DEFAULT_LOCALE,
    defaultValue: '__TRANSLATE_ME__',
    removeUnusedKeys: false,
  }
});
