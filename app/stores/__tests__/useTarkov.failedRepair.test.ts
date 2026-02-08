import { createPinia, setActivePinia } from 'pinia';
import { describe, expect, it } from 'vitest';
import { useTarkovStore } from '@/stores/useTarkov';
import type { UserProgressData } from '@/stores/progressState';
import type { Task } from '@/types/tarkov';
const createProgressData = (
  taskCompletions: UserProgressData['taskCompletions']
): UserProgressData => ({
  level: 1,
  pmcFaction: 'USEC',
  displayName: null,
  xpOffset: 0,
  taskObjectives: {},
  taskCompletions,
  hideoutParts: {},
  hideoutModules: {},
  traders: {},
  skills: {},
  prestigeLevel: 0,
  skillOffsets: {},
});
const createTask = (id: string, overrides: Partial<Task> = {}): Task => ({
  id,
  alternatives: [],
  failConditions: [],
  objectives: [],
  ...overrides,
});
describe('useTarkovStore failed-state repair', () => {
  it('keeps manually failed tasks during stale-failure cleanup', () => {
    setActivePinia(createPinia());
    const store = useTarkovStore();
    const gameModeData = createProgressData({
      'task-manual': { complete: true, failed: true, manual: true },
    });
    const tasksMap = new Map<string, Task>([['task-manual', createTask('task-manual')]]);
    const repairedCount = store.repairGameModeFailedTasks(gameModeData, tasksMap);
    expect(repairedCount).toBe(0);
    expect(gameModeData.taskCompletions['task-manual']).toMatchObject({
      complete: true,
      failed: true,
      manual: true,
    });
  });
  it('clears stale non-manual failed tasks with no valid fail source', () => {
    setActivePinia(createPinia());
    const store = useTarkovStore();
    const gameModeData = createProgressData({
      'task-stale': { complete: true, failed: true },
    });
    const tasksMap = new Map<string, Task>([['task-stale', createTask('task-stale')]]);
    const repairedCount = store.repairGameModeFailedTasks(gameModeData, tasksMap);
    expect(repairedCount).toBe(1);
    expect(gameModeData.taskCompletions['task-stale']).toMatchObject({
      complete: false,
      failed: false,
      manual: false,
    });
  });
});
