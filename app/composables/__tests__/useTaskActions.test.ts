import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import type { Task } from '@/types/tarkov';
const createTarkovStore = (options: {
  playerLevel?: number;
  objectiveCounts?: Record<string, number>;
}) => {
  const objectiveCounts = new Map<string, number>(Object.entries(options.objectiveCounts ?? {}));
  return {
    setTaskComplete: vi.fn(),
    setTaskFailed: vi.fn(),
    setTaskUncompleted: vi.fn(),
    setTaskObjectiveComplete: vi.fn(),
    setTaskObjectiveUncomplete: vi.fn(),
    setObjectiveCount: vi.fn((objectiveId: string, count: number) => {
      objectiveCounts.set(objectiveId, count);
    }),
    getObjectiveCount: vi.fn((objectiveId: string) => objectiveCounts.get(objectiveId) ?? 0),
    playerLevel: vi.fn(() => options.playerLevel ?? 1),
    setLevel: vi.fn(),
    isTaskFailed: vi.fn(() => false),
  };
};
const createMetadataStore = (tasks: Task[]) => ({
  tasks,
});
const setup = async (
  task: Task,
  tasks: Task[],
  options: Parameters<typeof createTarkovStore>[0],
  preferencesOverrides: Partial<{
    getPinnedTaskIds: string[];
  }> = {}
) => {
  const onAction = vi.fn();
  const tarkovStore = createTarkovStore(options);
  const metadataStore = createMetadataStore(tasks);
  const togglePinnedTask = vi.fn();
  const preferencesStore = {
    getPinnedTaskIds: [],
    togglePinnedTask,
    ...preferencesOverrides,
  };
  vi.resetModules();
  vi.doMock('@/stores/useTarkov', () => ({
    useTarkovStore: () => tarkovStore,
  }));
  vi.doMock('@/stores/useMetadata', () => ({
    useMetadataStore: () => metadataStore,
  }));
  vi.doMock('@/stores/usePreferences', () => ({
    usePreferencesStore: () => preferencesStore,
  }));
  vi.doMock('vue-i18n', () => ({
    useI18n: () => ({
      t: (_key: string, fallback?: string) => fallback ?? _key,
    }),
  }));
  const { useTaskActions } = await import('@/composables/useTaskActions');
  const taskRef = ref(task);
  const actions = useTaskActions(() => taskRef.value, onAction);
  return {
    actions,
    onAction,
    taskRef,
    tarkovStore,
    togglePinnedTask,
  };
};
describe('useTaskActions', () => {
  it('marks a task complete and handles alternatives', async () => {
    const task: Task = {
      id: 'task-main',
      name: 'Main Task',
      minPlayerLevel: 5,
      objectives: [{ id: 'obj-main', count: 2 }],
      alternatives: ['task-alt'],
    };
    const alternative: Task = {
      id: 'task-alt',
      name: 'Alt Task',
      objectives: [{ id: 'obj-alt', count: 1 }],
    };
    const { actions, onAction, tarkovStore } = await setup(task, [task, alternative], {
      playerLevel: 2,
      objectiveCounts: { 'obj-alt': 1 },
    });
    actions.markTaskComplete();
    expect(tarkovStore.setTaskComplete).toHaveBeenCalledWith('task-main');
    expect(tarkovStore.setTaskObjectiveComplete).toHaveBeenCalledWith('obj-main');
    expect(tarkovStore.setObjectiveCount).toHaveBeenCalledWith('obj-main', 2);
    expect(tarkovStore.setTaskFailed).toHaveBeenCalledWith('task-alt');
    expect(tarkovStore.setTaskObjectiveUncomplete).toHaveBeenCalledWith('obj-alt');
    expect(tarkovStore.setObjectiveCount).toHaveBeenCalledWith('obj-alt', 0);
    expect(tarkovStore.setLevel).toHaveBeenCalledWith(5);
    expect(onAction).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'complete', taskId: 'task-main' })
    );
  });
  it('marks a task available and processes requirements', async () => {
    const requirementTask: Task = {
      id: 'task-req',
      name: 'Requirement',
      objectives: [{ id: 'obj-req', count: 1 }],
    };
    const predecessorTask: Task = {
      id: 'task-pre',
      name: 'Predecessor',
      objectives: [{ id: 'obj-pre', count: 1 }],
    };
    const task: Task = {
      id: 'task-main',
      name: 'Main Task',
      minPlayerLevel: 3,
      taskRequirements: [
        {
          task: { id: 'task-req' },
          // This requirement models a task that becomes available when another task fails
          status: ['Failed'],
        },
      ],
      predecessors: ['task-pre'],
    };
    const { actions, onAction, tarkovStore } = await setup(
      task,
      [task, requirementTask, predecessorTask],
      {
        playerLevel: 1,
        objectiveCounts: { 'obj-req': 1 },
      }
    );
    actions.markTaskAvailable();
    expect(tarkovStore.setTaskFailed).toHaveBeenCalledWith('task-req');
    expect(tarkovStore.setTaskObjectiveUncomplete).toHaveBeenCalledWith('obj-req');
    expect(tarkovStore.setObjectiveCount).toHaveBeenCalledWith('obj-req', 0);
    expect(tarkovStore.setTaskComplete).toHaveBeenCalledWith('task-pre');
    expect(tarkovStore.setTaskObjectiveComplete).toHaveBeenCalledWith('obj-pre');
    expect(tarkovStore.setObjectiveCount).toHaveBeenCalledWith('obj-pre', 1);
    expect(tarkovStore.setLevel).toHaveBeenCalledWith(3);
    expect(onAction).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'available', taskId: 'task-main' })
    );
  });
  it('marks a task failed and invokes onAction', async () => {
    const task: Task = {
      id: 'task-to-fail',
      name: 'Task to Fail',
      objectives: [{ id: 'obj-fail', count: 2 }],
    };
    const { actions, onAction, tarkovStore } = await setup(task, [task], {
      objectiveCounts: { 'obj-fail': 2 },
    });
    actions.markTaskFailed();
    expect(tarkovStore.setTaskFailed).toHaveBeenCalledWith('task-to-fail');
    expect(tarkovStore.setTaskObjectiveUncomplete).toHaveBeenCalledWith('obj-fail');
    expect(tarkovStore.setObjectiveCount).toHaveBeenCalledWith('obj-fail', 0);
    expect(onAction).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'fail', taskId: 'task-to-fail' })
    );
  });
  it('unpins a pinned task when completing', async () => {
    const task: Task = {
      id: 'task-pin-complete',
      name: 'Pinned Task',
      objectives: [{ id: 'obj-pin', count: 1 }],
    };
    const { actions, togglePinnedTask } = await setup(
      task,
      [task],
      {},
      {
        getPinnedTaskIds: ['task-pin-complete'],
      }
    );
    actions.markTaskComplete();
    expect(togglePinnedTask).toHaveBeenCalledTimes(1);
    expect(togglePinnedTask).toHaveBeenCalledWith('task-pin-complete');
  });
  it('unpins a pinned task when failing', async () => {
    const task: Task = {
      id: 'task-pin-fail',
      name: 'Pinned Task',
      objectives: [{ id: 'obj-pin-fail', count: 1 }],
    };
    const { actions, togglePinnedTask } = await setup(
      task,
      [task],
      {},
      {
        getPinnedTaskIds: ['task-pin-fail'],
      }
    );
    actions.markTaskFailed();
    expect(togglePinnedTask).toHaveBeenCalledTimes(1);
    expect(togglePinnedTask).toHaveBeenCalledWith('task-pin-fail');
  });
  it('marks a task uncompleted and resets objectives', async () => {
    const task: Task = {
      id: 'task-uncomplete',
      name: 'Task to Uncomplete',
      objectives: [{ id: 'obj-unc', count: 3 }],
    };
    const { actions, onAction, tarkovStore } = await setup(task, [task], {
      objectiveCounts: { 'obj-unc': 3 },
    });
    actions.markTaskUncomplete();
    expect(tarkovStore.setTaskUncompleted).toHaveBeenCalledWith('task-uncomplete');
    expect(tarkovStore.setTaskObjectiveUncomplete).toHaveBeenCalledWith('obj-unc');
    // markTaskUncomplete uses handleTaskObjectives which only calls setTaskObjectiveUncomplete, not setObjectiveCount
    expect(tarkovStore.setObjectiveCount).not.toHaveBeenCalled();
    expect(onAction).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'uncomplete', taskId: 'task-uncomplete' })
    );
  });
  it('handles tasks with no objectives gracefully', async () => {
    const task: Task = {
      id: 'task-no-obj',
      name: 'Task No Objectives',
      objectives: [],
    };
    const { actions, onAction, tarkovStore } = await setup(task, [task], {});
    actions.markTaskComplete();
    expect(tarkovStore.setTaskComplete).toHaveBeenCalledWith('task-no-obj');
    expect(tarkovStore.setTaskObjectiveComplete).not.toHaveBeenCalled();
    expect(onAction).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'complete', taskId: 'task-no-obj' })
    );
  });
  it('handles tasks with no alternatives gracefully', async () => {
    const task: Task = {
      id: 'task-no-alt',
      name: 'Task No Alternatives',
      objectives: [{ id: 'obj-no-alt', count: 1 }],
      alternatives: undefined,
    };
    const { actions, onAction, tarkovStore } = await setup(task, [task], {});
    actions.markTaskComplete();
    expect(tarkovStore.setTaskComplete).toHaveBeenCalledWith('task-no-alt');
    expect(tarkovStore.setTaskFailed).not.toHaveBeenCalled();
    expect(onAction).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'complete', taskId: 'task-no-alt' })
    );
  });
  it('handles tasks with null/undefined fields without exceptions (defensive runtime handling)', async () => {
    // This test validates defensive handling of malformed/untyped external input.
    // In practice, task data from external APIs may have missing or null fields
    // despite TypeScript types. The unsafe assertions simulate this scenario.
    const task: Task = {
      id: 'task-null-fields',
      name: 'Task with Null Fields',
      objectives: undefined as unknown as Task['objectives'],
      alternatives: null as unknown as Task['alternatives'],
      predecessors: null as unknown as Task['predecessors'],
      taskRequirements: null as unknown as Task['taskRequirements'],
    };
    const { actions, onAction, tarkovStore } = await setup(task, [task], {});
    expect(() => actions.markTaskComplete()).not.toThrow();
    expect(tarkovStore.setTaskComplete).toHaveBeenCalledWith('task-null-fields');
    expect(onAction).toHaveBeenCalled();
  });
  it('handles marking available with no predecessors or requirements', async () => {
    const task: Task = {
      id: 'task-simple',
      name: 'Simple Task',
      objectives: [{ id: 'obj-simple', count: 1 }],
    };
    const { actions, onAction, tarkovStore } = await setup(task, [task], {});
    actions.markTaskAvailable();
    expect(tarkovStore.setTaskComplete).not.toHaveBeenCalled();
    expect(tarkovStore.setTaskFailed).not.toHaveBeenCalled();
    expect(onAction).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'available', taskId: 'task-simple' })
    );
  });
});
