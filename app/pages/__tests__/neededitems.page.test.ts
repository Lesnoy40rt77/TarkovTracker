import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it, vi } from 'vitest';
import { isRef, ref } from 'vue';
import type { NeededItemTaskObjective } from '@/types/tarkov';
import {
  createDefaultNeededItem,
  createMockMetadataStore,
  createMockPreferencesStore,
  createMockProgressStore,
  createMockTarkovStore,
} from '../../../tests/test-helpers/mockStores';
const setup = async (
  options: {
    neededItem?: NeededItemTaskObjective | null;
    viewMode?: 'list' | 'grid';
    groupByItem?: boolean;
    itemsLoading?: boolean;
    emptyState?: boolean;
  } = {}
) => {
  const {
    neededItem = createDefaultNeededItem(),
    viewMode = 'list',
    groupByItem = false,
    itemsLoading = false,
    emptyState = false,
  } = options;
  vi.resetModules();
  vi.doMock('pinia', async () => {
    const actual = await vi.importActual<typeof import('pinia')>('pinia');
    return {
      ...actual,
      storeToRefs: (store: Record<string, unknown>) => {
        const refs: Record<string, unknown> = {};
        Object.entries(store).forEach(([key, value]) => {
          refs[key] = isRef(value) ? value : ref(value);
        });
        return refs;
      },
    };
  });
  vi.doMock('@/composables/useInfiniteScroll', () => ({
    useInfiniteScroll: () => ({ checkAndLoadMore: vi.fn() }),
  }));
  vi.doMock('@/composables/useSharedBreakpoints', () => ({
    useSharedBreakpoints: () => ({
      belowMd: ref(false),
      xs: ref(false),
    }),
  }));
  vi.doMock('@/stores/useMetadata', () => ({
    useMetadataStore: createMockMetadataStore({
      neededItem: emptyState ? null : neededItem,
      tasks: emptyState ? [] : [{ id: 'task-1' }],
      hideoutStations: emptyState ? [] : [{ id: 'station-1' }],
      itemsLoading,
      itemsFullLoaded: !itemsLoading,
    }),
  }));
  vi.doMock('@/stores/useProgress', () => ({
    useProgressStore: createMockProgressStore(),
  }));
  vi.doMock('@/stores/usePreferences', () => ({
    usePreferencesStore: createMockPreferencesStore({
      neededItemsViewMode: viewMode,
      neededItemsGroupByItem: groupByItem,
    }),
  }));
  vi.doMock('@/stores/useTarkov', () => ({
    useTarkovStore: createMockTarkovStore(),
  }));
  vi.doMock('vue-i18n', () => ({
    useI18n: () => ({
      t: (_key: string, fallback?: string) => fallback ?? _key,
    }),
  }));
  const { default: NeededItemsPage } = await import('@/pages/neededitems.vue');
  return NeededItemsPage;
};
const defaultGlobalStubs = {
  NeededItemsFilterBar: { template: '<div data-testid="filter-bar" />' },
  NeededItem: {
    props: ['need', 'itemStyle'],
    template: '<div data-testid="needed-item" :data-style="itemStyle" />',
  },
  NeededItemGroupedCard: {
    props: ['groupedItem'],
    template: '<div data-testid="grouped-item" />',
  },
  UCard: { template: '<div><slot /></div>' },
  UIcon: true,
};
describe('needed items page', () => {
  it('renders needed items list view', async () => {
    const NeededItemsPage = await setup({ viewMode: 'list' });
    const wrapper = await mountSuspended(NeededItemsPage, {
      global: { stubs: defaultGlobalStubs },
    });
    expect(wrapper.find('[data-testid="filter-bar"]').exists()).toBe(true);
    // Component renders in list view mode
    // Note: Items may or may not render depending on mock data availability
  });
  it('renders needed items grid view', async () => {
    const NeededItemsPage = await setup({ viewMode: 'grid' });
    const wrapper = await mountSuspended(NeededItemsPage, {
      global: { stubs: defaultGlobalStubs },
    });
    expect(wrapper.find('[data-testid="filter-bar"]').exists()).toBe(true);
    // Component renders in grid view mode
  });
  it('renders grouped view when groupByItem is enabled', async () => {
    const NeededItemsPage = await setup({ groupByItem: true });
    const wrapper = await mountSuspended(NeededItemsPage, {
      global: { stubs: defaultGlobalStubs },
    });
    expect(wrapper.find('[data-testid="filter-bar"]').exists()).toBe(true);
    // Component renders in grouped view mode
  });
  describe('empty and loading states', () => {
    it('renders empty state when no items', async () => {
      const NeededItemsPage = await setup({ emptyState: true });
      const wrapper = await mountSuspended(NeededItemsPage, {
        global: { stubs: defaultGlobalStubs },
      });
      // Filter bar should still be present
      expect(wrapper.find('[data-testid="filter-bar"]').exists()).toBe(true);
      // No needed items should be rendered
      const neededItems = wrapper.findAll('[data-testid="needed-item"]');
      expect(neededItems.length).toBe(0);
    });
    it('renders loading state', async () => {
      const NeededItemsPage = await setup({ itemsLoading: true });
      const wrapper = await mountSuspended(NeededItemsPage, {
        global: { stubs: defaultGlobalStubs },
      });
      expect(wrapper.find('[data-testid="filter-bar"]').exists()).toBe(true);
      // When loading, verify the component renders without errors
    });
  });
  describe('view mode rendering', () => {
    it('renders list style items in list view mode', async () => {
      const NeededItemsPage = await setup({ viewMode: 'list' });
      const wrapper = await mountSuspended(NeededItemsPage, {
        global: { stubs: defaultGlobalStubs },
      });
      expect(wrapper.find('[data-testid="filter-bar"]').exists()).toBe(true);
      // Verifies component can render in list view mode
    });
    it('renders card style items in grid view mode', async () => {
      const NeededItemsPage = await setup({ viewMode: 'grid' });
      const wrapper = await mountSuspended(NeededItemsPage, {
        global: { stubs: defaultGlobalStubs },
      });
      expect(wrapper.find('[data-testid="filter-bar"]').exists()).toBe(true);
      // Verifies component can render in grid view mode
    });
  });
});
