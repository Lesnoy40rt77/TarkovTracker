import { logger } from '@/utils/logger';
export interface UseCopyToClipboardReturn {
  copyToClipboard: (text: string) => Promise<boolean>;
}
async function writeToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    logger.warn('[Clipboard] Clipboard API failed, trying fallback:', error);
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', 'true');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return true;
  } catch (error) {
    logger.error('[Clipboard] Fallback copy failed:', error);
    return false;
  }
}
export function useCopyToClipboard(): UseCopyToClipboardReturn {
  const { t } = useI18n({ useScope: 'global' });
  const toast = useToast();
  const copyToClipboard = async (text: string): Promise<boolean> => {
    const success = await writeToClipboard(text);
    if (success) {
      toast.add({
        title: t('toast.clipboard_copied.title'),
        description: t('toast.clipboard_copied.description', { value: text }),
        color: 'success',
      });
    } else {
      toast.add({
        title: t('toast.clipboard_error.title'),
        description: t('toast.clipboard_error.description', { value: text }),
        color: 'error',
      });
    }
    return success;
  };
  return { copyToClipboard };
}
export { writeToClipboard };
