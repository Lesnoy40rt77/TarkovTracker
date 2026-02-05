import { markI18nReady } from '@/composables/i18nHelpers';
import { isSupportedLocale } from '@/utils/locales';
import { logger } from '@/utils/logger';
import { STORAGE_KEYS } from '@/utils/storageKeys';
import type { SupportedLocale } from '@/utils/locales';
import type { Composer, I18n } from 'vue-i18n';
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
function setI18nLocale(i18n: I18n | Composer, locale: SupportedLocale): boolean {
  const target = 'global' in i18n ? i18n.global : i18n;
  if (!('locale' in target)) return false;
  const localeValue = target.locale as unknown;
  if (typeof localeValue === 'string') {
    (target as { locale: string }).locale = locale;
    return true;
  }
  if (localeValue && typeof localeValue === 'object' && 'value' in localeValue) {
    (localeValue as { value: string }).value = locale;
    return true;
  }
  return false;
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
    if (!setI18nLocale(i18n, initialLocale)) {
      logger.warn('[i18n] Failed to set locale on i18n instance; skipping locale init.');
    }
    markI18nReady();
  },
});
