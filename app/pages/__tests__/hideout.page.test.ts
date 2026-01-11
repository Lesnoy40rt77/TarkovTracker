import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import HideoutPage from '@/pages/hideout.vue';
import type { HideoutStation } from '@/types/tarkov';
/**
 * Deep freezes an object and all nested objects/arrays to prevent accidental mutation.
 * Uses a WeakSet to protect against circular references.
 */
const deepFreeze = <T extends object>(obj: T, seen = new WeakSet<object>()): Readonly<T> => {
  if (seen.has(obj)) return obj as Readonly<T>;
  seen.add(obj);
  Object.keys(obj).forEach((key) => {
    const value = (obj as Record<string, unknown>)[key];
    if (value && typeof value === 'object') {
      deepFreeze(value as object, seen);
    }
  });
  return Object.freeze(obj);
};
const station: Readonly<HideoutStation> = deepFreeze({
  id: 'station-1',
  name: 'Workbench',
  levels: [
    {
      id: 'station-1-1',
      level: 1,
      description: 'Level 1',
      constructionTime: 0,
      itemRequirements: [],
      stationLevelRequirements: [],
      skillRequirements: [],
      traderRequirements: [],
      crafts: [],
    },
  ],
});
vi.mock('@/composables/useHideoutFiltering', () => ({
  useHideoutFiltering: () => ({
    activePrimaryView: ref('available'),
    isStoreLoading: ref(false),
    visibleStations: ref([station]),
    stationCounts: ref({ available: 1, maxed: 0, locked: 0, all: 1 }),
  }),
}));
vi.mock('@/stores/useMetadata', () => ({
  useMetadataStore: () => ({
    hideoutStations: [station],
  }),
}));
vi.mock('@/stores/useProgress', () => ({
  useProgressStore: () => ({
    hideoutLevels: { 'station-1': { self: 1 } },
  }),
}));
vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}));
describe('hideout page', () => {
  it('renders hideout cards', async () => {
    const wrapper = await mountSuspended(HideoutPage, {
      global: {
        stubs: {
          HideoutCard: { template: '<div data-testid="hideout-card" />' },
          RefreshButton: true,
          UAlert: true,
          UButton: true,
          UIcon: true,
        },
      },
    });
    expect(wrapper.find('[data-testid="hideout-card"]').exists()).toBe(true);
  });
});
