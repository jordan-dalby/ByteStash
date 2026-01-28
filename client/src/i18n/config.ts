import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { setDefaultOptions, type Locale as DateFnsLocale } from 'date-fns'
import { DEFAULT_LOCALE } from './constants';
import { resources } from './resources';
import { Locale } from './types';

async function setDateFnsDefaultOptions(language?: string) {
  let currentLocaleName = language || i18n.language;

  if (currentLocaleName === Locale.en) {
    currentLocaleName = 'enUS';
  }

  const localeModule = (await import(`date-fns/locale`) as any);
  const currentDateFnsLocale: DateFnsLocale = localeModule[currentLocaleName];

  setDefaultOptions({ locale: currentDateFnsLocale });
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: DEFAULT_LOCALE,
    debug: true,
    saveMissing: true,
    saveMissingPlurals: true,
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