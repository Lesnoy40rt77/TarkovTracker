import { describe, expect, it, vi } from 'vitest';
import type { Task, TaskObjective, Trader } from '@/types/tarkov';
const createTasks = (): Task[] => [
  {
    id: 'task-a',
    name: 'Task A',
    kappaRequired: true,
    factionName: 'Any',
    trader: { id: 'trader-1', name: 'Trader One' },
    objectives: [{ id: 'obj-a', taskId: 'task-a' }],
  },
  {
    id: 'task-b',
    name: 'Task B',
    lightkeeperRequired: true,
    factionName: 'Any',
    trader: { id: 'trader-1', name: 'Trader One' },
    objectives: [{ id: 'obj-b', taskId: 'task-b' }],
  },
  {
    id: 'task-c',
    name: 'Task C',
    factionName: 'Any',
    trader: { id: 'trader-2', name: 'Trader Two' },
    objectives: [{ id: 'obj-c', taskId: 'task-c' }],
  },
  {
    id: 'task-d',
    name: 'Task D',
    factionName: 'Any',
    trader: { id: 'trader-2', name: 'Trader Two' },
    objectives: [{ id: 'obj-d', taskId: 'task-d' }],
  },
];
const createObjectives = (): TaskObjective[] => [
  {
    id: 'obj-a',
    taskId: 'task-a',
    type: 'giveItem',
    count: 1,
    item: { id: 'item-a', name: 'Item A' },
  },
  {
    id: 'obj-b',
    taskId: 'task-b',
    type: 'giveItem',
    count: 2,
    item: { id: 'item-b', name: 'Item B' },
  },
  {
    id: 'obj-c',
    taskId: 'task-c',
    type: 'giveItem',
    count: 1,
    item: { id: 'item-c', name: 'Item C' },
  },
  {
    id: 'obj-d',
    taskId: 'task-d',
    type: 'giveItem',
    count: 1,
    item: { id: 'item-d', name: 'Item D' },
  },
];
const createProgressStore = () => ({
  invalidTasks: {
    'task-d': { self: true },
  } as Record<string, { self: boolean }>,
  objectiveCompletions: {
    'obj-a': { self: true },
    'obj-b': { self: false },
  } as Record<string, { self: boolean }>,
});
const createTarkovStore = (
  overrides: {
    completedTasks?: Set<string>;
    failedTasks?: Set<string>;
    completedObjectives?: Set<string>;
    isTaskComplete?: (taskId: string) => boolean;
    isTaskFailed?: (taskId: string) => boolean;
    isTaskObjectiveComplete?: (objectiveId: string) => boolean;
  } = {}
) => {
  const completedTasks = overrides.completedTasks ?? new Set(['task-a', 'task-c']);
  const failedTasks = overrides.failedTasks ?? new Set(['task-b']);
  const completedObjectives = overrides.completedObjectives ?? new Set(['obj-a']);
  return {
    isTaskComplete: overrides.isTaskComplete ?? ((taskId: string) => completedTasks.has(taskId)),
    isTaskFailed: overrides.isTaskFailed ?? ((taskId: string) => failedTasks.has(taskId)),
    isTaskObjectiveComplete:
      overrides.isTaskObjectiveComplete ??
      ((objectiveId: string) => completedObjectives.has(objectiveId)),
    getPMCFaction: () => 'USEC',
    getGameEdition: () => 1,
    getObjectiveCount: () => 0,
  };
};
interface SetupOverrides {
  tasks?: Task[];
  objectives?: TaskObjective[];
  traders?: Trader[];
  progressStore?: ReturnType<typeof createProgressStore>;
  tarkovStore?: ReturnType<typeof createTarkovStore>;
}
const setup = async (overrides: SetupOverrides = {}) => {
  const tasks = overrides.tasks ?? createTasks();
  const objectives = overrides.objectives ?? createObjectives();
  const traders = overrides.traders ?? [
    { id: 'trader-1', name: 'Trader One' },
    { id: 'trader-2', name: 'Trader Two' },
  ];
  const metadataStore = {
    tasks,
    objectives,
    traders,
    sortedTraders: traders,
    editions: [],
  };
  const progressStore = overrides.progressStore ?? createProgressStore();
  const tarkovStore = overrides.tarkovStore ?? createTarkovStore();
  vi.resetModules();
  vi.doMock('@/stores/useMetadata', () => ({
    useMetadataStore: () => metadataStore,
  }));
  vi.doMock('@/stores/useProgress', () => ({
    useProgressStore: () => progressStore,
  }));
  vi.doMock('@/stores/useTarkov', () => ({
    useTarkovStore: () => tarkovStore,
  }));
  const { useDashboardStats } = await import('@/composables/useDashboardStats');
  return {
    dashboardStats: useDashboardStats(),
  };
};
describe('useDashboardStats', () => {
  it('calculates task totals and failures correctly', async () => {
    const { dashboardStats } = await setup();
    expect(dashboardStats.totalTasks.value).toBe(2);
    expect(dashboardStats.completedTasks.value).toBe(2);
    expect(dashboardStats.failedTasksCount.value).toBe(1);
  });
  it('calculates kappa and lightkeeper stats', async () => {
    const { dashboardStats } = await setup();
    expect(dashboardStats.totalKappaTasks.value).toBe(1);
    expect(dashboardStats.completedKappaTasks.value).toBe(1);
    expect(dashboardStats.totalLightkeeperTasks.value).toBe(0);
    expect(dashboardStats.completedLightkeeperTasks.value).toBe(0);
  });
  it('builds trader stats excluding invalid and failed tasks', async () => {
    const { dashboardStats } = await setup();
    expect(dashboardStats.traderStats.value).toEqual([
      {
        id: 'trader-1',
        name: 'Trader One',
        imageLink: undefined,
        totalTasks: 1,
        completedTasks: 1,
        percentage: '100.0',
      },
      {
        id: 'trader-2',
        name: 'Trader Two',
        imageLink: undefined,
        totalTasks: 1,
        completedTasks: 1,
        percentage: '100.0',
      },
    ]);
  });
  it('returns zero counters when tasks array is empty', async () => {
    const { dashboardStats } = await setup({
      tasks: [],
      objectives: [],
      traders: [],
      progressStore: {
        invalidTasks: {},
        objectiveCompletions: {},
      },
      tarkovStore: createTarkovStore({
        isTaskComplete: () => false,
        isTaskFailed: () => false,
        isTaskObjectiveComplete: () => false,
      }),
    });
    expect(dashboardStats.totalTasks.value).toBe(0);
    expect(dashboardStats.completedTasks.value).toBe(0);
    expect(dashboardStats.failedTasksCount.value).toBe(0);
    expect(dashboardStats.totalKappaTasks.value).toBe(0);
    expect(dashboardStats.totalLightkeeperTasks.value).toBe(0);
    expect(dashboardStats.traderStats.value).toEqual([]);
  });
  it('handles all tasks invalid or failed correctly', async () => {
    const tasks: Task[] = [
      {
        id: 'task-fail-1',
        name: 'Failed Task 1',
        factionName: 'Any',
        trader: { id: 'trader-1', name: 'Trader One' },
        objectives: [{ id: 'obj-fail-1', taskId: 'task-fail-1' }],
      },
      {
        id: 'task-fail-2',
        name: 'Failed Task 2',
        factionName: 'Any',
        trader: { id: 'trader-1', name: 'Trader One' },
        objectives: [{ id: 'obj-fail-2', taskId: 'task-fail-2' }],
      },
    ];
    const { dashboardStats } = await setup({
      tasks,
      objectives: [],
      traders: [{ id: 'trader-1', name: 'Trader One' }],
      progressStore: {
        invalidTasks: {},
        objectiveCompletions: {},
      },
      tarkovStore: createTarkovStore({
        isTaskComplete: () => false,
        isTaskFailed: () => true,
        isTaskObjectiveComplete: () => false,
      }),
    });
    expect(dashboardStats.totalTasks.value).toBe(0);
    expect(dashboardStats.completedTasks.value).toBe(0);
    expect(dashboardStats.failedTasksCount.value).toBe(2);
  });
  it('handles traders with zero valid tasks safely (no division by zero)', async () => {
    const tasks: Task[] = [
      {
        id: 'task-invalid',
        name: 'Invalid Task',
        factionName: 'Any',
        trader: { id: 'trader-1', name: 'Trader One' },
        objectives: [{ id: 'obj-invalid', taskId: 'task-invalid' }],
      },
    ];
    const { dashboardStats } = await setup({
      tasks,
      objectives: [],
      traders: [{ id: 'trader-1', name: 'Trader One' }],
      progressStore: {
        invalidTasks: { 'task-invalid': { self: true } },
        objectiveCompletions: {},
      },
      tarkovStore: createTarkovStore({
        isTaskComplete: () => false,
        isTaskFailed: () => false,
        isTaskObjectiveComplete: () => false,
      }),
    });
    // traderStats filters out traders with zero tasks, so trader-1 should not be present
    const traderStat = dashboardStats.traderStats.value.find((t) => t.id === 'trader-1');
    expect(traderStat).toBeUndefined();
    // Verify empty traderStats when all tasks are invalid
    expect(dashboardStats.traderStats.value).toEqual([]);
  });
  it('excludes tasks without assigned traders from traderStats but counts in totals', async () => {
    const tasks: Task[] = [
      {
        id: 'task-no-trader',
        name: 'Task Without Trader',
        factionName: 'Any',
        trader: undefined,
        objectives: [{ id: 'obj-no-trader', taskId: 'task-no-trader' }],
      },
      {
        id: 'task-with-trader',
        name: 'Task With Trader',
        factionName: 'Any',
        trader: { id: 'trader-1', name: 'Trader One' },
        objectives: [{ id: 'obj-with-trader', taskId: 'task-with-trader' }],
      },
    ];
    const { dashboardStats } = await setup({
      tasks,
      objectives: [],
      traders: [{ id: 'trader-1', name: 'Trader One' }],
      progressStore: {
        invalidTasks: {},
        objectiveCompletions: {},
      },
      // Intentionally relies on Set-based isTaskComplete behavior via completedTasks override
      // rather than explicit isTaskComplete function to test the default Set lookup path
      tarkovStore: createTarkovStore({
        completedTasks: new Set(['task-no-trader', 'task-with-trader']),
        isTaskFailed: () => false,
        isTaskObjectiveComplete: () => false,
      }),
    });
    expect(dashboardStats.totalTasks.value).toBe(2);
    expect(dashboardStats.completedTasks.value).toBe(2);
    const traderStat = dashboardStats.traderStats.value.find((t) => t.id === 'trader-1');
    expect(traderStat?.totalTasks).toBe(1);
    expect(traderStat?.completedTasks).toBe(1);
  });
});
