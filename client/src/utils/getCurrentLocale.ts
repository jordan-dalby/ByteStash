import i18n from 'i18next'
import { LOCALE_ISO_CODES, DEFAULT_LOCALE_ISO_CODE } from '../i18n/constants'
import { Locale } from '../i18n/types'

export function getCurrentLocale() {
  const { language } = i18n;

  return {
    locale: language,
    isoCode: LOCALE_ISO_CODES[language as Locale] || DEFAULT_LOCALE_ISO_CODE,
  };
}