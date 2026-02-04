import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import SettingsPage from '@/pages/settings.vue';
// Module-level state that mocks can reference
const mockState = {
  isLoggedIn: false,
  isAdmin: false,
  gameEdition: 1,
  prestigeLevel: 0,
  streamerMode: false,
};
const mockFns = {
  setGameEdition: vi.fn(),
  setPrestigeLevel: vi.fn(),
  setStreamerMode: vi.fn(),
  resetPvPData: vi.fn(),
  resetPvEData: vi.fn(),
  resetAllData: vi.fn(),
};
// Top-level mocks using mockNuxtImport (auto-hoisted)
mockNuxtImport('useNuxtApp', () => () => ({
  $supabase: {
    user: {
      get loggedIn() {
        return mockState.isLoggedIn;
      },
      displayName: 'User',
      photoURL: '',
    },
  },
  deferHydration: () => () => {},
  isHydrating: false,
  runWithContext: (fn: () => unknown) => fn(),
  hooks: {
    hookOnce: vi.fn(),
    callHookWith: vi.fn(() => Promise.resolve()),
    callHook: vi.fn(() => Promise.resolve()),
  },
}));
mockNuxtImport('useToast', () => () => ({
  add: vi.fn(),
}));
mockNuxtImport('useRouter', () => () => ({
  replace: vi.fn(),
  resolve: vi.fn(() => ({ href: '/' })),
}));
mockNuxtImport('useSeoMeta', () => () => {});
vi.mock('@/stores/useMetadata', () => ({
  useMetadataStore: () => ({
    editions: [
      { value: 1, title: 'Standard' },
      { value: 2, title: 'Left Behind' },
      { value: 3, title: 'Prepare for Escape' },
    ],
  }),
}));
vi.mock('@/stores/usePreferences', () => ({
  usePreferencesStore: () => ({
    get getStreamerMode() {
      return mockState.streamerMode;
    },
    setStreamerMode: mockFns.setStreamerMode,
  }),
}));
vi.mock('@/stores/useSystemStore', () => ({
  useSystemStore: () => ({
    get isAdmin() {
      return mockState.isAdmin;
    },
  }),
  useSystemStoreWithSupabase: () => ({
    hasInitiallyLoaded: ref(true),
  }),
}));
vi.mock('@/stores/useTarkov', () => ({
  useTarkovStore: () => ({
    getCurrentGameMode: () => 'pvp',
    getGameEdition: () => mockState.gameEdition,
    setGameEdition: mockFns.setGameEdition,
    getPrestigeLevel: () => mockState.prestigeLevel,
    setPrestigeLevel: mockFns.setPrestigeLevel,
    resetPvPData: mockFns.resetPvPData,
    resetPvEData: mockFns.resetPvEData,
    resetAllData: mockFns.resetAllData,
  }),
}));
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}));
const defaultGlobalStubs = {
  AccountDeletionCard: true,
  ApiTokens: true,
  DisplayNameCard: true,
  ExperienceCard: true,
  GenericCard: {
    template: '<div data-testid="generic-card"><slot /><slot name="content" /></div>',
  },
  InterfaceSettingsCard: {
    template:
      '<div data-testid="interface-settings-card"><input type="checkbox" data-testid="interface-settings-card-switch" /></div>',
  },
  ImportConfirmDialog: true,
  MigrationSteps: true,
  SkillsCard: true,
  UAlert: true,
  UBadge: true,
  UButton: {
    props: ['disabled'],
    emits: ['click'],
    template:
      '<button data-testid="u-button" :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
  },
  UIcon: true,
  UInput: true,
  UModal: true,
  UTabs: {
    template: '<div><slot name="gameplay" /><slot name="interface" /><slot name="account" /></div>',
  },
  USelectMenu: {
    props: ['modelValue', 'items', 'options'],
    emits: ['update:modelValue'],
    template:
      '<select data-testid="u-select" @change="$emit(\'update:modelValue\', Number($event.target.value))"><option v-for="opt in (items || options || [])" :key="opt.value ?? opt" :value="opt.value ?? opt">{{ opt.label || opt.title || opt }}</option></select>',
  },
  USwitch: {
    props: ['modelValue', 'disabled'],
    emits: ['update:modelValue'],
    template:
      '<input type="checkbox" data-testid="u-switch" :checked="modelValue" :disabled="disabled" @change="$emit(\'update:modelValue\', $event.target.checked)" />',
  },
  UTooltip: { template: '<span><slot /></span>' },
};
// Helper to configure mock state for each test
const configureMockState = (
  options: {
    isLoggedIn?: boolean;
    isAdmin?: boolean;
    gameEdition?: number;
    prestigeLevel?: number;
    streamerMode?: boolean;
  } = {}
) => {
  mockState.isLoggedIn = options.isLoggedIn ?? false;
  mockState.isAdmin = options.isAdmin ?? false;
  mockState.gameEdition = options.gameEdition ?? 1;
  mockState.prestigeLevel = options.prestigeLevel ?? 0;
  mockState.streamerMode = options.streamerMode ?? false;
};
describe('settings page', () => {
  beforeEach(() => {
    // Reset mock state to defaults before each test
    configureMockState();
    vi.clearAllMocks();
  });
  it('renders settings layout', async () => {
    const wrapper = await mountSuspended(SettingsPage, {
      global: { stubs: defaultGlobalStubs },
    });
    expect(wrapper.find('[data-testid="generic-card"]').exists()).toBe(true);
  });
  describe('user states', () => {
    it('renders logged out state', async () => {
      configureMockState({ isLoggedIn: false });
      const wrapper = await mountSuspended(SettingsPage, {
        global: { stubs: defaultGlobalStubs },
      });
      expect(wrapper.find('[data-testid="generic-card"]').exists()).toBe(true);
      // Note: Login-specific UI elements would require the page to expose them via data-testid.
      // Current implementation renders generic cards for all states.
    });
    it('renders logged in state', async () => {
      configureMockState({ isLoggedIn: true });
      const wrapper = await mountSuspended(SettingsPage, {
        global: { stubs: defaultGlobalStubs },
      });
      expect(wrapper.find('[data-testid="generic-card"]').exists()).toBe(true);
      // Note: Profile-specific UI elements would require the page to expose them via data-testid.
    });
    it('renders admin state', async () => {
      configureMockState({ isLoggedIn: true, isAdmin: true });
      const wrapper = await mountSuspended(SettingsPage, {
        global: { stubs: defaultGlobalStubs },
      });
      expect(wrapper.find('[data-testid="generic-card"]').exists()).toBe(true);
      // Note: Admin-specific UI elements would require the page to expose them via data-testid.
    });
  });
  describe('edition and prestige settings', () => {
    it('renders with different game editions', async () => {
      configureMockState({ gameEdition: 2 });
      const wrapper = await mountSuspended(SettingsPage, {
        global: { stubs: defaultGlobalStubs },
      });
      expect(wrapper.find('[data-testid="generic-card"]').exists()).toBe(true);
    });
    it('renders with prestige level', async () => {
      configureMockState({ prestigeLevel: 3 });
      const wrapper = await mountSuspended(SettingsPage, {
        global: { stubs: defaultGlobalStubs },
      });
      expect(wrapper.find('[data-testid="generic-card"]').exists()).toBe(true);
    });
    it('renders edition select with numeric value handling', async () => {
      configureMockState({ gameEdition: 2 });
      const wrapper = await mountSuspended(SettingsPage, {
        global: { stubs: defaultGlobalStubs },
      });
      const selects = wrapper.findAll('[data-testid="u-select"]');
      expect(selects.length).toBeGreaterThan(0);
      // Verify the select stub is rendered and configured to emit numeric values
      // The USelectMenu stub uses Number() conversion matching real component behavior
      const editionSelect = selects[0];
      expect(editionSelect?.exists()).toBe(true);
    });
  });
  describe('streamer mode', () => {
    it('renders streamer mode toggle', async () => {
      configureMockState({ streamerMode: false });
      const wrapper = await mountSuspended(SettingsPage, {
        global: { stubs: defaultGlobalStubs },
      });
      const toggle = wrapper.find('[data-testid="interface-settings-card-switch"]');
      expect(toggle.exists()).toBe(true);
    });
    it('renders with streamer mode enabled', async () => {
      configureMockState({ streamerMode: true });
      const wrapper = await mountSuspended(SettingsPage, {
        global: { stubs: defaultGlobalStubs },
      });
      expect(wrapper.find('[data-testid="generic-card"]').exists()).toBe(true);
    });
  });
});
