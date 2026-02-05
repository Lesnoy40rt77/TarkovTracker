import { useI18n } from 'vue-i18n';
export type LocalIgnoredReason = 'other_account' | 'unsaved' | 'guest';
export type ToastTranslate = (key: string, params?: Record<string, unknown>) => string;
const LOAD_FAILED_TOAST_DURATION = 10000;
export interface UseToastI18nReturn {
  showHideoutUpdated: (removedCount: number) => void;
  showLocalIgnored: (reason: LocalIgnoredReason) => void;
  showLoadFailed: () => void;
}
export const useToastI18n = (translate?: ToastTranslate): UseToastI18nReturn => {
  const toast = useToast();
  const getGlobalT = (): ToastTranslate => {
    try {
      return useI18n({ useScope: 'global' }).t;
    } catch {
      return (key: string) => key;
    }
  };
  const t = translate ?? getGlobalT();
  const showHideoutUpdated = (removedCount: number) => {
    toast.add({
      title: t('toast.hideout_updated.title'),
      description: t('toast.hideout_updated.description', { count: removedCount }),
      color: 'warning',
    });
  };
  const showLocalIgnored = (reason: LocalIgnoredReason) => {
    toast.add({
      title: t('toast.local_ignored.title'),
      description: t(`toast.local_ignored.${reason}`),
      color: 'warning',
    });
  };
  const showLoadFailed = () => {
    toast.add({
      title: t('toast.load_failed.title'),
      description: t('toast.load_failed.description'),
      color: 'error',
      duration: LOAD_FAILED_TOAST_DURATION,
    });
  };
  return { showHideoutUpdated, showLocalIgnored, showLoadFailed };
};
