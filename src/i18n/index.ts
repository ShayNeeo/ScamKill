import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';
import vi from '../locales/vi.json';
import en from '../locales/en.json';
import { getDialect } from './regional';

const translations = { vi, en } as const;

const i18n = new I18n(translations);
i18n.defaultLocale = 'vi';
i18n.locale = 'vi';
i18n.enableFallback = true;

/** Typed internationalization wrapper. Returns key as fallback if missing. */
export function t(key: string, params?: Record<string, string | number>): string {
  const activeLocale = getDialect() === 'en' ? 'en' : 'vi';
  if (i18n.locale !== activeLocale) {
    i18n.locale = activeLocale;
  }
  return i18n.t(key, params) ?? key;
}

export { i18n, translations };
