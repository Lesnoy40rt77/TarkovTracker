import { useTarkovStore } from '@/stores/useTarkov';
import { logger } from '@/utils/logger';
import type { Task, TaskObjective } from '@/types/tarkov';
export interface UseTaskCardLinksOptions {
  task: () => Task;
  objectives: () => TaskObjective[];
}
export function useTaskCardLinks(options: UseTaskCardLinksOptions) {
  const { task, objectives } = options;
  const router = useRouter();
  const tarkovStore = useTarkovStore();
  const selectedItem = ref<{ id: string; wikiLink?: string } | null>(null);
  const tarkovDevTaskUrl = computed(() => `https://tarkov.dev/task/${task().id}`);
  const copyTextToClipboard = async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      logger.warn('[TaskCardLinks] Clipboard API failed, trying fallback:', error);
    }
    try {
      // Note: document.execCommand('copy') is deprecated but intentionally retained
      // as a legacy fallback for browsers without navigator.clipboard support
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
      logger.error('[TaskCardLinks] Fallback copy failed:', error);
      return false;
    }
  };
  const copyTaskLink = async (): Promise<boolean> => {
    const href = router.resolve(`/tasks?task=${task().id}`).href;
    return copyTextToClipboard(`${window.location.origin}${href}`);
  };
  const openTaskWiki = () => {
    const wikiLink = task().wikiLink;
    if (wikiLink) {
      window.open(wikiLink, '_blank');
    }
  };
  const openTaskOnTarkovDev = () => {
    window.open(tarkovDevTaskUrl.value, '_blank');
  };
  const getTaskDataIssueUrl = (): string => {
    const currentTask = task();
    const taskObjectives = objectives();
    const title = `${currentTask.name} (${currentTask.id})`;
    const objectiveIds = taskObjectives.map((objective) => objective.id).filter(Boolean);
    const minLevel = currentTask.minPlayerLevel ?? 0;
    const playerLevel = tarkovStore.playerLevel();
    const gameMode = tarkovStore.getCurrentGameMode().toUpperCase();
    const descriptionLines = [
      `Task Name: ${currentTask.name}`,
      `Task ID: ${currentTask.id}`,
      objectiveIds.length ? `Objective IDs: ${objectiveIds.join(', ')}` : '',
      minLevel > 0 ? `Task Req Level: ${minLevel}` : '',
      `Dev Link: https://tarkov.dev/task/${currentTask.id}`,
      playerLevel > 0 ? `\nUSER LEVEL: ${playerLevel}` : '',
      `USER MODE: ${gameMode}`,
    ].filter(Boolean);
    const description = `>--Describe issue here--<\n\n\n${descriptionLines.join('\n')}`;
    const params = new URLSearchParams({
      title,
      category: 'Overlay - Quests',
      description,
    });
    if (currentTask.wikiLink) {
      params.set('reference', currentTask.wikiLink);
    }
    return `https://issue.tarkovtracker.org/data?${params.toString()}`;
  };
  const openTaskDataIssue = () => {
    window.open(getTaskDataIssueUrl(), '_blank');
  };
  const setSelectedItem = (item: { id: string; wikiLink?: string } | null) => {
    selectedItem.value = item;
  };
  const openItemOnTarkovDev = () => {
    if (!selectedItem.value) return;
    window.open(`https://tarkov.dev/item/${selectedItem.value.id}`, '_blank');
  };
  const openItemOnWiki = () => {
    if (!selectedItem.value) return;
    if (selectedItem.value.wikiLink) {
      window.open(selectedItem.value.wikiLink, '_blank');
      return;
    }
    window.open(
      `https://escapefromtarkov.fandom.com/wiki/Special:Search?query=${selectedItem.value.id}`,
      '_blank'
    );
  };
  return {
    selectedItem,
    tarkovDevTaskUrl,
    copyTextToClipboard,
    copyTaskLink,
    openTaskWiki,
    openTaskOnTarkovDev,
    getTaskDataIssueUrl,
    openTaskDataIssue,
    setSelectedItem,
    openItemOnTarkovDev,
    openItemOnWiki,
  };
}
