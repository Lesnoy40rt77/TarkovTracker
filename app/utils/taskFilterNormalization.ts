import { TASK_SECONDARY_VIEWS, type TaskSecondaryView } from '@/types/taskFilter';
import { TASK_SORT_MODES, type TaskSortMode } from '@/types/taskSort';
export const VALID_SORT_MODES = new Set<TaskSortMode>(TASK_SORT_MODES);
export const VALID_SECONDARY_VIEWS = new Set<TaskSecondaryView>(TASK_SECONDARY_VIEWS);
const extractNormalizationCandidate = (value: unknown): unknown => {
  if (typeof value === 'string') {
    return value;
  }
  if (value && typeof value === 'object' && 'value' in value) {
    return (value as { value?: unknown }).value;
  }
  return null;
};
export const normalizeSortMode = (value: unknown): TaskSortMode => {
  const candidate = extractNormalizationCandidate(value);
  if (typeof candidate === 'string' && VALID_SORT_MODES.has(candidate as TaskSortMode)) {
    return candidate as TaskSortMode;
  }
  return 'none';
};
export const normalizeSecondaryView = (value: unknown): TaskSecondaryView => {
  const candidate = extractNormalizationCandidate(value);
  if (typeof candidate === 'string' && VALID_SECONDARY_VIEWS.has(candidate as TaskSecondaryView)) {
    return candidate as TaskSecondaryView;
  }
  return 'all';
};
