import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, defineComponent, h, isRef, nextTick, reactive, ref } from 'vue';
import type { TarkovMap, Trader } from '@/types/tarkov';
type QueryRecord = Record<string, string | undefined>;
type RouteState = {
  query: QueryRecord;
};
const routeState = reactive({
  query: reactive<QueryRecord>({}),
}) as RouteState;
const applyRouteQuery = (query: QueryRecord) => {
  Object.keys(routeState.query).forEach((key) => {
    routeState.query[key] = undefined;
  });
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined) {
      routeState.query[key] = value;
    }
  });
};
const push = vi.fn(async ({ query }: { query: QueryRecord }) => {
  applyRouteQuery(query);
});
const replace = vi.fn(async ({ query }: { query: QueryRecord }) => {
  applyRouteQuery(query);
});
mockNuxtImport('useRoute', () => () => routeState);
mockNuxtImport('useRouter', () => () => ({ push, replace, afterEach: vi.fn() }));
const storeState = reactive({
  taskMapView: 'all',
  taskPrimaryView: 'all',
  taskTraderView: 'all',
});
const setTaskPrimaryView = vi.fn((view: string) => {
  storeState.taskPrimaryView = view;
});
const setTaskMapView = vi.fn((view: string) => {
  storeState.taskMapView = view;
});
const setTaskTraderView = vi.fn((view: string) => {
  storeState.taskTraderView = view;
});
const loggerMock = {
  debug: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
};
const flushRouteSync = async () => {
  await vi.runAllTimersAsync();
  await nextTick();
};
describe('useTaskRouteSync', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    vi.resetModules();
    vi.clearAllMocks();
    storeState.taskPrimaryView = 'all';
    storeState.taskMapView = 'all';
    storeState.taskTraderView = 'all';
    applyRouteQuery({
      map: '6733700029c367a3d40b02af',
      view: 'maps',
    });
    vi.doMock('pinia', async () => {
      const actual = await vi.importActual<typeof import('pinia')>('pinia');
      return {
        ...actual,
        storeToRefs: (store: Record<string, unknown>) => {
          const refs: Record<string, unknown> = {};
          Object.entries(store).forEach(([key, value]) => {
            if (typeof value === 'function') return;
            refs[key] = isRef(value) ? value : computed(() => store[key]);
          });
          return refs;
        },
      };
    });
    vi.doMock('@/stores/usePreferences', () => ({
      usePreferencesStore: () => ({
        get getTaskMapView() {
          return storeState.taskMapView;
        },
        get getTaskPrimaryView() {
          return storeState.taskPrimaryView;
        },
        get getTaskTraderView() {
          return storeState.taskTraderView;
        },
        setTaskMapView,
        setTaskPrimaryView,
        setTaskTraderView,
      }),
    }));
    vi.doMock('@/utils/logger', () => ({
      logger: loggerMock,
    }));
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  it('preserves pending map query and resolves merged ids once maps load', async () => {
    const maps = ref<TarkovMap[]>([]);
    const traders = ref<Trader[]>([]);
    const { useTaskRouteSync } = await import('@/composables/useTaskRouteSync');
    const TestHarness = defineComponent({
      setup() {
        useTaskRouteSync({ maps, traders });
        return () => h('div');
      },
    });
    const wrapper = mount(TestHarness);
    await flushRouteSync();
    expect(routeState.query.map).toBe('6733700029c367a3d40b02af');
    expect(push).not.toHaveBeenCalled();
    expect(loggerMock.warn).not.toHaveBeenCalled();
    maps.value = [
      {
        id: '5704e5fc2459771a4e3b4ad8',
        mergedIds: ['6733700029c367a3d40b02af', '5704e5fc2459771a4e3b4ad8'],
        name: 'Ground Zero',
      } as unknown as TarkovMap,
    ];
    await nextTick();
    await flushRouteSync();
    expect(setTaskMapView).toHaveBeenCalledWith('5704e5fc2459771a4e3b4ad8');
    expect(routeState.query.map).toBe('5704e5fc2459771a4e3b4ad8');
    expect(push.mock.calls.length + replace.mock.calls.length).toBeGreaterThan(0);
    wrapper.unmount();
  });
});
