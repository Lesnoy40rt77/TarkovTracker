import { markI18nReady } from '@/composables/i18nHelpers';
import { logger } from '@/utils/logger';
import { STORAGE_KEYS } from '@/utils/storageKeys';
import type { Composer, I18n } from 'vue-i18n';
const SUPPORTED_LOCALES = ['en', 'de', 'es', 'fr', 'ru', 'uk', 'zh'] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
const isSupportedLocale = (value: string): value is SupportedLocale =>
  SUPPORTED_LOCALES.includes(value as SupportedLocale);
function getInitialLocale(): SupportedLocale {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const savedPrefs = window.localStorage.getItem(STORAGE_KEYS.preferences);
      if (savedPrefs) {
        const prefs = JSON.parse(savedPrefs);
        if (prefs.localeOverride && isSupportedLocale(prefs.localeOverride)) {
          return prefs.localeOverride;
        }
      }
    } catch (error) {
      logger.warn('[i18n] Failed to read locale from localStorage:', error);
    }
  }
  const navLang = typeof navigator !== 'undefined' ? navigator.language : 'en';
  const resolved = (navLang || 'en').split(/[-_]/)[0] || 'en';
  return isSupportedLocale(resolved) ? resolved : 'en';
}
export default defineNuxtPlugin({
  name: 'i18n-ready',
  enforce: 'post',
  setup(nuxtApp) {
    const i18n = (nuxtApp as { $i18n?: I18n | Composer }).$i18n;
    if (!i18n) {
      logger.warn('[i18n] Missing i18n instance on nuxtApp; skipping locale init.');
      markI18nReady();
      return;
    }
    const initialLocale = getInitialLocale();
    if ('global' in i18n && i18n.global) {
      const globalLocale = i18n.global.locale as unknown;
      if (typeof globalLocale === 'string') {
        (i18n.global as { locale: string }).locale = initialLocale;
      } else if (globalLocale && typeof globalLocale === 'object' && 'value' in globalLocale) {
        (globalLocale as { value: string }).value = initialLocale;
      } else {
        logger.warn('[i18n] Missing locale on i18n global instance; skipping locale init.');
      }
    } else if ('locale' in i18n) {
      const composerLocale = i18n.locale as unknown;
      if (typeof composerLocale === 'string') {
        (i18n as unknown as { locale: string }).locale = initialLocale;
      } else if (
        composerLocale &&
        typeof composerLocale === 'object' &&
        'value' in composerLocale
      ) {
        (composerLocale as { value: string }).value = initialLocale;
      } else {
        logger.warn('[i18n] Missing locale on i18n composer instance; skipping locale init.');
      }
    } else {
      logger.warn('[i18n] Missing locale on i18n instance; skipping locale init.');
    }
    markI18nReady();
  },
});
