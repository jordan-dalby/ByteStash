import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { setDefaultOptions, type Locale as DateFnsLocale } from 'date-fns'
import { DEFAULT_LOCALE } from './constants';
import { resources } from './resources';

const DATE_FNS_LOCALE_MAP: Record<string, string> = {
  en: 'enUS',
  es: 'es',
  ru: 'ru',
  zh: 'zhCN',
};

async function setDateFnsDefaultOptions(language?: string) {
  const rawLocale = language || i18n.language;
  const baseLocale = rawLocale.split('-')[0];
  const dateFnsKey = DATE_FNS_LOCALE_MAP[baseLocale] ?? baseLocale;

  const localeModule = (await import(`date-fns/locale`) as any);
  const currentDateFnsLocale: DateFnsLocale = localeModule[dateFnsKey];

  if (currentDateFnsLocale) {
    setDefaultOptions({ locale: currentDateFnsLocale });
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: DEFAULT_LOCALE,
    debug: process.env.NODE_ENV === 'development',
    saveMissing: process.env.NODE_ENV === 'development',
    saveMissingPlurals: process.env.NODE_ENV === 'development',
    defaultNS: 'translation',
    fallbackNS: 'translation',
    interpolation: {
      escapeValue: false,
    },
    resources,
  }, () => {
    setDateFnsDefaultOptions();
  });

i18n
  .on('languageChanged', (language) => {
    setDateFnsDefaultOptions(language);
  });
