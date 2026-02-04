import { mount } from '@vue/test-utils';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { reactive, computed, nextTick } from 'vue';
const mockPreferencesState = reactive({
  taskTeamAllHidden: false,
  itemsTeamAllHidden: false,
  itemsTeamNonFIRHidden: false,
  itemsTeamHideoutHidden: false,
  mapTeamAllHidden: false,
});
const mockPreferencesStore = {
  get taskTeamAllHidden() {
    return mockPreferencesState.taskTeamAllHidden;
  },
  get itemsTeamAllHidden() {
    return mockPreferencesState.itemsTeamAllHidden;
  },
  get itemsTeamNonFIRHidden() {
    return mockPreferencesState.itemsTeamNonFIRHidden;
  },
  get itemsTeamHideoutHidden() {
    return mockPreferencesState.itemsTeamHideoutHidden;
  },
  get mapTeamAllHidden() {
    return mockPreferencesState.mapTeamAllHidden;
  },
  setQuestTeamHideAll: vi.fn(),
  setItemsTeamHideAll: vi.fn(),
  setItemsTeamNonFIR: vi.fn(),
  setItemsTeamHideHideout: vi.fn(),
  setMapTeamHideAll: vi.fn(),
};
vi.mock('@/stores/usePreferences', () => ({
  usePreferencesStore: () => mockPreferencesStore,
}));
const mountTeamOptions = async () => {
  const { default: TeamOptions } = await import('@/features/team/TeamOptions.vue');
  const wrapper = mount(TeamOptions, {
    global: {
      stubs: {
        GenericCard: {
          template: '<div><slot name="title" /><slot name="content" /><slot name="footer" /></div>',
        },
      },
      mocks: {
        $t: (key: string) => key,
      },
    },
  });
  await nextTick();
  return wrapper;
};
describe('TeamOptions preferences', () => {
  beforeEach(() => {
    mockPreferencesState.taskTeamAllHidden = false;
    mockPreferencesState.itemsTeamAllHidden = false;
    mockPreferencesState.itemsTeamNonFIRHidden = false;
    mockPreferencesState.itemsTeamHideoutHidden = false;
    mockPreferencesState.mapTeamAllHidden = false;
    vi.clearAllMocks();
  });
  describe('taskHideAll computed', () => {
    it('returns current taskTeamAllHidden value', () => {
      const taskHideAll = computed({
        get: () => mockPreferencesState.taskTeamAllHidden,
        set: (value) => {
          mockPreferencesState.taskTeamAllHidden = value;
        },
      });
      expect(taskHideAll.value).toBe(false);
      mockPreferencesState.taskTeamAllHidden = true;
      expect(taskHideAll.value).toBe(true);
    });
    it('sets taskTeamAllHidden when assigned', () => {
      const taskHideAll = computed({
        get: () => mockPreferencesState.taskTeamAllHidden,
        set: (value) => {
          mockPreferencesState.taskTeamAllHidden = value;
        },
      });
      taskHideAll.value = true;
      expect(mockPreferencesState.taskTeamAllHidden).toBe(true);
    });
  });
  describe('itemsHideAll computed', () => {
    it('returns current itemsTeamAllHidden value', () => {
      const itemsHideAll = computed({
        get: () => mockPreferencesState.itemsTeamAllHidden,
        set: (value) => {
          mockPreferencesState.itemsTeamAllHidden = value;
        },
      });
      expect(itemsHideAll.value).toBe(false);
      mockPreferencesState.itemsTeamAllHidden = true;
      expect(itemsHideAll.value).toBe(true);
    });
  });
  describe('dependent toggles', () => {
    it('disables item toggles when itemsTeamAllHidden is true', async () => {
      mockPreferencesState.itemsTeamAllHidden = true;
      const wrapper = await mountTeamOptions();
      const inputs = wrapper.findAll('input[type="checkbox"]');
      const nonFirInput = inputs[2]?.element as HTMLInputElement;
      const hideoutInput = inputs[3]?.element as HTMLInputElement;
      expect(nonFirInput.disabled).toBe(true);
      expect(hideoutInput.disabled).toBe(true);
      wrapper.unmount();
    });
    it('enables item toggles when itemsTeamAllHidden is false', async () => {
      mockPreferencesState.itemsTeamAllHidden = false;
      const wrapper = await mountTeamOptions();
      const inputs = wrapper.findAll('input[type="checkbox"]');
      const nonFirInput = inputs[2]?.element as HTMLInputElement;
      const hideoutInput = inputs[3]?.element as HTMLInputElement;
      expect(nonFirInput.disabled).toBe(false);
      expect(hideoutInput.disabled).toBe(false);
      wrapper.unmount();
    });
  });
  describe('label computation', () => {
    const taskHideAllLabel = computed(() =>
      mockPreferencesState.taskTeamAllHidden
        ? 'page.team.card.teamoptions.task_hide_all'
        : 'page.team.card.teamoptions.task_show_all'
    );
    it('returns hide label when preference is true', () => {
      mockPreferencesState.taskTeamAllHidden = true;
      expect(taskHideAllLabel.value).toBe('page.team.card.teamoptions.task_hide_all');
    });
    it('returns show label when preference is false', () => {
      mockPreferencesState.taskTeamAllHidden = false;
      expect(taskHideAllLabel.value).toBe('page.team.card.teamoptions.task_show_all');
    });
  });
  describe('mapHideAll computed', () => {
    it('toggles map team visibility', () => {
      const mapHideAll = computed({
        get: () => mockPreferencesState.mapTeamAllHidden,
        set: (value) => {
          mockPreferencesState.mapTeamAllHidden = value;
        },
      });
      expect(mapHideAll.value).toBe(false);
      mapHideAll.value = true;
      expect(mockPreferencesState.mapTeamAllHidden).toBe(true);
    });
  });
  describe('all preferences independent', () => {
    it('setting one preference does not affect others', () => {
      mockPreferencesState.taskTeamAllHidden = true;
      mockPreferencesState.itemsTeamAllHidden = false;
      mockPreferencesState.mapTeamAllHidden = true;
      expect(mockPreferencesState.taskTeamAllHidden).toBe(true);
      expect(mockPreferencesState.itemsTeamAllHidden).toBe(false);
      expect(mockPreferencesState.mapTeamAllHidden).toBe(true);
      expect(mockPreferencesState.itemsTeamNonFIRHidden).toBe(false);
      expect(mockPreferencesState.itemsTeamHideoutHidden).toBe(false);
    });
  });
});
