import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { isRef, ref } from 'vue';
import type { Task } from '@/types/tarkov';
/**
 * Factory to create a default Task with all required properties.
 * Use this instead of type assertions to ensure compile-time safety.
 */
function createDefaultTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    name: 'Sample Task',
    kappaRequired: false,
    lightkeeperRequired: false,
    experience: 0,
    objectives: [],
    taskRequirements: [],
    minPlayerLevel: 1,
    ...overrides,
  };
}
const defaultTask: Task = createDefaultTask();
const mapTask: Task = createDefaultTask({ id: 'task-map', name: 'Map Task' });
const globalTask: Task = createDefaultTask({ id: 'task-global', name: 'Global Task' });
const mockVisibleTasks = ref([defaultTask]);
const mockIsGlobalTask = vi.fn((task: Task) => task.id === 'task-global');
const mockPreferencesStore = {
  getTaskPrimaryView: 'all',
  getTaskSecondaryView: 'available',
  getTaskUserView: 'self',
  getTaskMapView: 'all',
  getTaskTraderView: 'all',
  getTaskSortMode: 'none',
  getTaskSortDirection: 'asc',
  getTaskSharedByAllOnly: false,
  getHideGlobalTasks: false,
  getHideNonKappaTasks: false,
  getShowNonSpecialTasks: true,
  getShowLightkeeperTasks: true,
  getOnlyTasksWithRequiredKeys: false,
  getRespectTaskFiltersForImpact: true,
  getPinnedTaskIds: [] as string[],
  mapTeamAllHidden: false,
  togglePinnedTask: vi.fn(),
};
// Top-level mocks (auto-hoisted by vitest)
vi.mock('pinia', async () => {
  const actual = await vi.importActual<typeof import('pinia')>('pinia');
  return {
    ...actual,
    storeToRefs: (store: Record<string, unknown>) => {
      const refs: Record<string, unknown> = {};
      Object.entries(store).forEach(([key, value]) => {
        refs[key] = value !== null && isRef(value) ? value : ref(value);
      });
      return refs;
    },
  };
});
vi.mock('@/composables/useTaskFiltering', () => ({
  useTaskFiltering: () => ({
    isGlobalTask: mockIsGlobalTask,
    visibleTasks: mockVisibleTasks,
    reloadingTasks: ref(false),
    updateVisibleTasks: vi.fn(),
  }),
}));
vi.mock('@/composables/useInfiniteScroll', () => ({
  useInfiniteScroll: () => ({
    checkAndLoadMore: vi.fn(),
  }),
}));
vi.mock('@/composables/useTarkovTime', () => ({
  useTarkovTime: () => ({
    tarkovTime: ref('12:00'),
  }),
}));
vi.mock('@/stores/useMetadata', () => ({
  useMetadataStore: () => ({
    tasks: [defaultTask],
    loading: false,
    hasInitialized: true,
    mapsWithSvg: [],
    sortedTraders: [],
    editions: [],
    objectiveMaps: {},
    objectiveGPS: {},
    fetchMapSpawnsData: vi.fn(() => Promise.resolve()),
  }),
}));
vi.mock('@/stores/usePreferences', () => ({
  usePreferencesStore: () => mockPreferencesStore,
}));
vi.mock('@/stores/useProgress', () => ({
  useProgressStore: () => ({
    tasksCompletions: {},
    tasksFailed: {},
    unlockedTasks: {},
  }),
}));
vi.mock('@/stores/useTarkov', () => ({
  useTarkovStore: () => ({
    getGameEdition: () => 1,
    isTaskObjectiveComplete: () => false,
  }),
}));
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}));
vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
  useRouter: () => ({
    replace: vi.fn(() => Promise.resolve()),
    push: vi.fn(() => Promise.resolve()),
  }),
}));
vi.mock('@/features/maps/LeafletMap.vue', () => ({
  default: { template: '<div data-testid="leaflet-map" />' },
}));
const defaultGlobalStubs = {
  TaskCard: {
    props: ['accentVariant', 'task'],
    template: '<div data-testid="task-card" :data-accent="accentVariant">{{ task.id }}</div>',
  },
  TaskFilterBar: { template: '<div data-testid="task-filter" />' },
  TaskEmptyState: true,
  TaskLoadingState: true,
  Teleport: true,
  Transition: false,
  UAlert: true,
  UButton: true,
  UCard: true,
  UIcon: true,
};
describe('tasks page', () => {
  let wrapper: Awaited<ReturnType<typeof mountSuspended>>;
  let TasksPage: typeof import('@/pages/tasks.vue').default;
  const mountPage = async () => {
    wrapper = await mountSuspended(TasksPage, {
      global: { stubs: defaultGlobalStubs },
    });
  };
  beforeEach(async () => {
    mockVisibleTasks.value = [defaultTask];
    mockIsGlobalTask.mockImplementation((task: Task) => task.id === 'task-global');
    mockPreferencesStore.getTaskPrimaryView = 'all';
    mockPreferencesStore.getTaskMapView = 'all';
    mockPreferencesStore.getHideGlobalTasks = false;
    mockPreferencesStore.getPinnedTaskIds = [];
    const module = await import('@/pages/tasks.vue');
    TasksPage = module.default;
  });
  it('renders task cards when tasks are available', async () => {
    await mountPage();
    expect(wrapper.find('[data-testid="task-card"]').exists()).toBe(true);
  });
  it('renders task filter bar', async () => {
    await mountPage();
    expect(wrapper.find('[data-testid="task-filter"]').exists()).toBe(true);
  });
  it('shows map tasks first and then global tasks in map view', async () => {
    mockVisibleTasks.value = [mapTask, globalTask];
    mockPreferencesStore.getTaskPrimaryView = 'maps';
    mockPreferencesStore.getTaskMapView = 'map-1';
    mockPreferencesStore.getHideGlobalTasks = false;
    await mountPage();
    expect(
      wrapper
        .findAll('[data-testid="task-card"]')
        .map((item: { text: () => string }) => item.text())
    ).toEqual(['task-map', 'task-global']);
    expect(wrapper.text()).toContain('page.tasks.global_tasks_section');
  });
  it('does not show global section when global tasks are disabled', async () => {
    mockVisibleTasks.value = [mapTask];
    mockPreferencesStore.getTaskPrimaryView = 'maps';
    mockPreferencesStore.getTaskMapView = 'map-1';
    mockPreferencesStore.getHideGlobalTasks = true;
    await mountPage();
    expect(wrapper.text()).not.toContain('page.tasks.global_tasks_section');
  });
  it('keeps global accent for pinned global tasks in map view', async () => {
    mockVisibleTasks.value = [globalTask];
    mockPreferencesStore.getTaskPrimaryView = 'maps';
    mockPreferencesStore.getTaskMapView = 'map-1';
    mockPreferencesStore.getHideGlobalTasks = false;
    mockPreferencesStore.getPinnedTaskIds = ['task-global'];
    await mountPage();
    expect(wrapper.find('[data-testid="task-card"]').attributes('data-accent')).toBe('global');
  });
});
