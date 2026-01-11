/**
 * Shared test helper factories for creating mock stores.
 * Used across page tests to reduce duplication and improve maintainability.
 */
import { ref } from 'vue';
import type { NeededItemTaskObjective } from '@/types/tarkov';
export interface MockMetadataStoreOptions {
  neededItem?: NeededItemTaskObjective | null;
  tasks?: Array<{ id: string; name?: string }>;
  loading?: boolean;
  hasInitialized?: boolean;
  itemsLoading?: boolean;
  itemsFullLoaded?: boolean;
  hideoutStations?: Array<{ id: string }>;
  tasksObjectivesHydrated?: boolean;
  hideoutLoading?: boolean;
}
export const createMockMetadataStore = (options: MockMetadataStoreOptions = {}) => {
  const {
    neededItem = null,
    tasks = [],
    loading = false,
    hasInitialized = true,
    itemsLoading = false,
    itemsFullLoaded = true,
    hideoutStations = [],
    tasksObjectivesHydrated = true,
    hideoutLoading = false,
  } = options;
  return () => ({
    neededItemTaskObjectives: ref(neededItem ? [neededItem] : []),
    neededItemHideoutModules: ref([]),
    itemsFullLoaded: ref(itemsFullLoaded),
    items: ref(neededItem ? [neededItem.item] : []),
    itemsLoading: ref(itemsLoading),
    editions: [],
    tasks,
    hideoutStations,
    tasksObjectivesHydrated,
    hideoutLoading,
    loading,
    hasInitialized,
    getTaskById: (id: string) => {
      const task = tasks.find((t) => t.id === id);
      return task ? { ...task, factionName: 'Any' } : null;
    },
    getStationById: () => null,
    fetchTaskObjectivesData: () => Promise.resolve(),
    fetchHideoutData: () => Promise.resolve(),
    ensureItemsFullLoaded: () => Promise.resolve(),
  });
};
export interface MockProgressStoreOptions {
  playerFaction?: Record<string, string>;
  objectiveCompletions?: Record<string, Record<string, boolean>>;
  tasksCompletions?: Record<string, Record<string, boolean>>;
  hideoutLevels?: Record<string, Record<string, number>>;
  tasksFailed?: Record<string, Record<string, boolean>>;
  unlockedTasks?: Record<string, Record<string, boolean>>;
}
export const createMockProgressStore = (options: MockProgressStoreOptions = {}) => {
  const {
    playerFaction = { self: 'USEC' },
    objectiveCompletions = {},
    tasksCompletions = {},
    hideoutLevels = {},
    tasksFailed = {},
    unlockedTasks = {},
  } = options;
  return () => ({
    playerFaction,
    objectiveCompletions,
    tasksCompletions,
    hideoutLevels,
    tasksFailed,
    unlockedTasks,
  });
};
export interface MockPreferencesStoreOptions {
  neededItemsViewMode?: 'list' | 'grid';
  neededTypeView?: string;
  neededItemsFirFilter?: string;
  neededItemsGroupByItem?: boolean;
  neededItemsHideNonFirSpecialEquipment?: boolean;
  neededItemsKappaOnly?: boolean;
  itemsTeamAllHidden?: boolean;
  enableHolidayEffects?: boolean;
  useAutomaticLevelCalculation?: boolean;
  taskPrimaryView?: string;
  taskSecondaryView?: string;
  taskUserView?: string;
  taskMapView?: string;
  taskTraderView?: string;
  taskSortMode?: string;
  taskSortDirection?: string;
  taskSharedByAllOnly?: boolean;
  hideNonKappaTasks?: boolean;
  showNonSpecialTasks?: boolean;
  showLightkeeperTasks?: boolean;
  streamerMode?: boolean;
}
export const createMockPreferencesStore = (options: MockPreferencesStoreOptions = {}) => {
  const {
    neededItemsViewMode = 'list',
    neededTypeView = 'all',
    neededItemsFirFilter = 'all',
    neededItemsGroupByItem = false,
    neededItemsHideNonFirSpecialEquipment = false,
    neededItemsKappaOnly = false,
    itemsTeamAllHidden = false,
    enableHolidayEffects = false,
    useAutomaticLevelCalculation = false,
    taskPrimaryView = 'all',
    taskSecondaryView = 'available',
    taskUserView = 'self',
    taskMapView = 'all',
    taskTraderView = 'all',
    taskSortMode = 'none',
    taskSortDirection = 'asc',
    taskSharedByAllOnly = false,
    hideNonKappaTasks = false,
    showNonSpecialTasks = true,
    showLightkeeperTasks = true,
    streamerMode = false,
  } = options;
  return () => ({
    // Needed items getters
    getNeededItemsViewMode: neededItemsViewMode,
    setNeededItemsViewMode: () => {},
    getNeededTypeView: neededTypeView,
    setNeededTypeView: () => {},
    getNeededItemsFirFilter: neededItemsFirFilter,
    setNeededItemsFirFilter: () => {},
    getNeededItemsGroupByItem: neededItemsGroupByItem,
    setNeededItemsGroupByItem: () => {},
    getNeededItemsHideNonFirSpecialEquipment: neededItemsHideNonFirSpecialEquipment,
    setNeededItemsHideNonFirSpecialEquipment: () => {},
    getNeededItemsKappaOnly: neededItemsKappaOnly,
    setNeededItemsKappaOnly: () => {},
    itemsTeamAllHidden,
    setItemsTeamHideAll: () => {},
    // Holiday effects (as getter functions matching real API)
    get getEnableHolidayEffects() {
      return enableHolidayEffects;
    },
    get getUseAutomaticLevelCalculation() {
      return useAutomaticLevelCalculation;
    },
    setTaskPrimaryView: () => {},
    setTaskTraderView: () => {},
    // Task getters
    getTaskPrimaryView: taskPrimaryView,
    getTaskSecondaryView: taskSecondaryView,
    getTaskUserView: taskUserView,
    getTaskMapView: taskMapView,
    getTaskTraderView: taskTraderView,
    getTaskSortMode: taskSortMode,
    getTaskSortDirection: taskSortDirection,
    getTaskSharedByAllOnly: taskSharedByAllOnly,
    getHideNonKappaTasks: hideNonKappaTasks,
    getShowNonSpecialTasks: showNonSpecialTasks,
    getShowLightkeeperTasks: showLightkeeperTasks,
    // Streamer mode
    getStreamerMode: streamerMode,
    setStreamerMode: () => {},
  });
};
export interface MockTarkovStoreOptions {
  gameEdition?: number;
  playerLevel?: number;
  objectiveCount?: number;
  hideoutPartCount?: number;
  prestigeLevel?: number;
  currentGameMode?: string;
}
export const createMockTarkovStore = (options: MockTarkovStoreOptions = {}) => {
  const {
    gameEdition = 1,
    playerLevel = 8,
    objectiveCount = 0,
    hideoutPartCount = 0,
    prestigeLevel = 0,
    currentGameMode = 'pvp',
  } = options;
  return () => ({
    getGameEdition: () => gameEdition,
    setGameEdition: () => {},
    playerLevel: () => playerLevel,
    getObjectiveCount: () => objectiveCount,
    getHideoutPartCount: () => hideoutPartCount,
    getPrestigeLevel: () => prestigeLevel,
    setPrestigeLevel: () => {},
    getCurrentGameMode: () => currentGameMode,
    isTaskObjectiveComplete: () => false,
    isTaskComplete: () => false,
    isTaskFailed: () => false,
    resetPvPData: () => {},
    resetPvEData: () => {},
    resetAllData: () => {},
  });
};
export const createDefaultNeededItem = (
  overrides: Partial<NeededItemTaskObjective> = {}
): NeededItemTaskObjective => ({
  id: 'need-1',
  needType: 'taskObjective',
  taskId: 'task-1',
  item: { id: 'item-1', name: 'Item' },
  count: 1,
  foundInRaid: false,
  ...overrides,
});
