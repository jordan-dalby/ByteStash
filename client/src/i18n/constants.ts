import { Locale } from './types'

export const LOCALE_ISO_CODES: Record<Locale, string> = {
  [Locale.en]: 'en-US',
  [Locale.ru]: 'ru-RU',
};
export const DEFAULT_LOCALE: Locale = Locale.en;
export const DEFAULT_LOCALE_ISO_CODE = LOCALE_ISO_CODES[Locale.en];