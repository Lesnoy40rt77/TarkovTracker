import { useI18n } from 'vue-i18n';
type LocalIgnoredReason = 'otherAccount' | 'unsaved' | 'guest';
type ToastTranslate = (key: string, params?: Record<string, unknown>) => string;
export const useToastI18n = (translate?: ToastTranslate) => {
  const toast = useToast();
  const t =
    translate ??
    (() => {
      try {
        return useI18n({ useScope: 'global' }).t;
      } catch {
        return (key: string) => key;
      }
    })();
  const showHideoutUpdated = (removedCount: number) => {
    toast.add({
      title: t('toast.hideoutUpdated.title'),
      description: t('toast.hideoutUpdated.description', { count: removedCount }),
      color: 'warning',
    });
  };
  const showLocalIgnored = (reason: LocalIgnoredReason) => {
    toast.add({
      title: t('toast.localIgnored.title'),
      description: t(`toast.localIgnored.${reason}`),
      color: 'warning',
    });
  };
  const showLoadFailed = () => {
    toast.add({
      title: t('toast.loadFailed.title'),
      description: t('toast.loadFailed.description'),
      color: 'error',
      duration: 10000,
    });
  };
  return { showHideoutUpdated, showLocalIgnored, showLoadFailed };
};
