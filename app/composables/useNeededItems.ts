import { useNeededItemsSorting } from '@/composables/useNeededItemsSorting';
import {
  getNeededItemData,
  getNeededItemId,
  isNonFirSpecialEquipment,
} from '@/features/neededitems/neededItemFilters';
import { useMetadataStore } from '@/stores/useMetadata';
import { usePreferencesStore } from '@/stores/usePreferences';
import { useProgressStore } from '@/stores/useProgress';
import { useTarkovStore } from '@/stores/useTarkov';
import { isTaskAvailableForEdition } from '@/utils/editionHelpers';
import { fuzzyMatch } from '@/utils/fuzzySearch';
import { logger } from '@/utils/logger';
import type {
  NeededItemsSortBy,
  NeededItemsSortDirection,
} from '@/composables/useNeededItemsSorting';
import type {
  NeededItemsFirFilter,
  NeededItemsFilterType,
} from '@/features/neededitems/neededitems-constants';
import type {
  GroupedNeededItem,
  NeededItemHideoutModule,
  NeededItemTaskObjective,
} from '@/types/tarkov';
const DEFAULT_FULL_LOAD_TIMEOUT_MS = 5000;
const DEFAULT_FULL_LOAD_MIN_TIME_MS = 16;
const DEFAULT_FULL_LOAD_DELAY_MS = 1500;
type FullItemsLoadOptions = {
  priority?: 'normal' | 'high';
  timeout?: number;
  minTime?: number;
  delayMs?: number;
};
type NeededItemsViewMode = 'list' | 'grid';
type NeededItemsCardStyle = 'compact' | 'expanded';
export interface UseNeededItemsOptions {
  search?: Ref<string>;
  t?: (key: string) => string;
}
export interface FilterTab {
  label: string;
  value: NeededItemsFilterType;
  icon: string;
  count: number;
}
export interface UseNeededItemsReturn {
  activeFilter: WritableComputedRef<NeededItemsFilterType>;
  firFilter: WritableComputedRef<NeededItemsFirFilter>;
  groupByItem: WritableComputedRef<boolean>;
  hideNonFirSpecialEquipment: WritableComputedRef<boolean>;
  hideTeamItems: WritableComputedRef<boolean>;
  kappaOnly: WritableComputedRef<boolean>;
  hideOwned: WritableComputedRef<boolean>;
  sortBy: WritableComputedRef<NeededItemsSortBy>;
  sortDirection: WritableComputedRef<NeededItemsSortDirection>;
  viewMode: WritableComputedRef<NeededItemsViewMode>;
  cardStyle: WritableComputedRef<NeededItemsCardStyle>;
  allItems: ComputedRef<(NeededItemTaskObjective | NeededItemHideoutModule)[]>;
  filteredItems: ComputedRef<(NeededItemTaskObjective | NeededItemHideoutModule)[]>;
  groupedItems: ComputedRef<GroupedNeededItem[]>;
  displayItems: ComputedRef<
    GroupedNeededItem[] | (NeededItemTaskObjective | NeededItemHideoutModule)[]
  >;
  objectivesByItemId: ComputedRef<
    Map<
      string,
      { taskObjectives: NeededItemTaskObjective[]; hideoutModules: NeededItemHideoutModule[] }
    >
  >;
  filterTabsWithCounts: ComputedRef<FilterTab[]>;
  itemsReady: ComputedRef<boolean>;
  itemsError: ComputedRef<Error | null>;
  itemsFullLoaded: ComputedRef<boolean>;
  ensureNeededItemsData: () => void;
  queueFullItemsLoad: (loadOptions?: FullItemsLoadOptions) => void;
}
export function useNeededItems(options: UseNeededItemsOptions = {}): UseNeededItemsReturn {
  const { search = ref(''), t } = options;
  const metadataStore = useMetadataStore();
  const progressStore = useProgressStore();
  const preferencesStore = usePreferencesStore();
  const tarkovStore = useTarkovStore();
  const defaultTranslations: Record<string, string> = {
    'neededItems.filters.all': 'All',
    'neededItems.filters.tasks': 'Tasks',
    'neededItems.filters.hideout': 'Hideout',
    'neededItems.filters.completed': 'Completed',
  };
  const translate = (key: string) => (t ? t(key) : defaultTranslations[key] || key);
  const neededItemTaskObjectives = computed(() => metadataStore.neededItemTaskObjectives);
  const neededItemHideoutModules = computed(() => metadataStore.neededItemHideoutModules);
  const itemsFullLoaded = computed(() => metadataStore.itemsFullLoaded);
  const items = computed(() => metadataStore.items);
  const viewMode = computed({
    get: () => preferencesStore.getNeededItemsViewMode as NeededItemsViewMode,
    set: (value) => preferencesStore.setNeededItemsViewMode(value),
  });
  const activeFilter = computed({
    get: () => preferencesStore.getNeededTypeView as NeededItemsFilterType,
    set: (value) => preferencesStore.setNeededTypeView(value),
  });
  const firFilter = computed({
    get: () => preferencesStore.getNeededItemsFirFilter as NeededItemsFirFilter,
    set: (value) => preferencesStore.setNeededItemsFirFilter(value),
  });
  const groupByItem = computed({
    get: () => preferencesStore.getNeededItemsGroupByItem,
    set: (value) => preferencesStore.setNeededItemsGroupByItem(value),
  });
  const hideNonFirSpecialEquipment = computed({
    get: () => preferencesStore.getNeededItemsHideNonFirSpecialEquipment,
    set: (value) => preferencesStore.setNeededItemsHideNonFirSpecialEquipment(value),
  });
  const kappaOnly = computed({
    get: () => preferencesStore.getNeededItemsKappaOnly,
    set: (value) => preferencesStore.setNeededItemsKappaOnly(value),
  });
  const sortBy = computed({
    get: () => preferencesStore.getNeededItemsSortBy as NeededItemsSortBy,
    set: (value) => preferencesStore.setNeededItemsSortBy(value),
  });
  const sortDirection = computed({
    get: () => preferencesStore.getNeededItemsSortDirection as NeededItemsSortDirection,
    set: (value) => preferencesStore.setNeededItemsSortDirection(value),
  });
  const hideOwned = computed({
    get: () => preferencesStore.getNeededItemsHideOwned,
    set: (value) => preferencesStore.setNeededItemsHideOwned(value),
  });
  const cardStyle = computed({
    get: () => preferencesStore.getNeededItemsCardStyle as NeededItemsCardStyle,
    set: (value) => preferencesStore.setNeededItemsCardStyle(value),
  });
  const hideTeamItems = computed({
    get: () => preferencesStore.itemsTeamAllHidden,
    set: (value) => preferencesStore.setItemsTeamHideAll(value),
  });
  const userFaction = computed(() => progressStore.playerFaction['self'] ?? 'USEC');
  const userEdition = computed(() => tarkovStore.getGameEdition());
  const itemsLoaded = computed(() => (items.value?.length ?? 0) > 0);
  const itemsError = computed(() => metadataStore.itemsError);
  const itemsReady = computed(
    () => itemsLoaded.value && !metadataStore.itemsLoading && !itemsError.value
  );
  const fullItemsQueued = ref(false);
  const { sortNeededItems, sortGroupedItems } = useNeededItemsSorting({
    sortBy,
    sortDirection,
  });
  const isNeededWithTeam = (
    need: NeededItemTaskObjective | NeededItemHideoutModule
  ): need is
    | (NeededItemTaskObjective & {
        teamId?: string | null;
        team?: { id?: string | null } | string | null;
      })
    | (NeededItemHideoutModule & {
        teamId?: string | null;
        team?: { id?: string | null } | string | null;
      }) => {
    return !!need && typeof need === 'object' && ('teamId' in need || 'team' in need);
  };
  const getNeedTeamId = (
    need: NeededItemTaskObjective | NeededItemHideoutModule
  ): string | null => {
    if (!isNeededWithTeam(need)) return null;
    if (need.teamId) {
      return need.teamId;
    }
    if (typeof need.team === 'string') {
      return need.team || null;
    }
    return need.team?.id ?? null;
  };
  const queueFullItemsLoad = (loadOptions: FullItemsLoadOptions = {}) => {
    if (itemsFullLoaded.value) return;
    const {
      priority = 'normal',
      timeout = DEFAULT_FULL_LOAD_TIMEOUT_MS,
      minTime = DEFAULT_FULL_LOAD_MIN_TIME_MS,
      delayMs = DEFAULT_FULL_LOAD_DELAY_MS,
    } = loadOptions;
    if (priority !== 'high' && fullItemsQueued.value) return;
    if (priority !== 'high') {
      fullItemsQueued.value = true;
    }
    const run = () => {
      void metadataStore.ensureItemsFullLoaded(false, { priority, timeout, minTime });
    };
    if (typeof window === 'undefined' || delayMs <= 0 || priority === 'high') {
      run();
      return;
    }
    window.setTimeout(run, delayMs);
  };
  const ensureNeededItemsData = () => {
    if (!itemsLoaded.value && !metadataStore.itemsLoading) {
      void metadataStore.fetchItemsLiteData();
    }
    if (!metadataStore.tasksObjectivesHydrated && !metadataStore.tasksObjectivesPending) {
      void metadataStore.fetchTaskObjectivesData();
    }
    if (!metadataStore.hideoutStations.length && !metadataStore.hideoutLoading) {
      void metadataStore.fetchHideoutData();
    }
  };
  watch(
    itemsLoaded,
    (loaded) => {
      if (loaded && !itemsFullLoaded.value) {
        queueFullItemsLoad();
      }
    },
    { immediate: true }
  );
  watch(hideNonFirSpecialEquipment, (enabled) => {
    if (enabled && !itemsFullLoaded.value) {
      queueFullItemsLoad({ priority: 'high', timeout: 800, minTime: 8, delayMs: 0 });
    }
  });
  const allItems = computed(() => {
    const combined = [
      ...(neededItemTaskObjectives.value || []),
      ...(neededItemHideoutModules.value || []),
    ];
    const aggregated = new Map<string, NeededItemTaskObjective | NeededItemHideoutModule>();
    for (const need of combined) {
      let key: string;
      let itemId: string | undefined;
      if (need.needType === 'taskObjective') {
        if (!isTaskAvailableForEdition(need.taskId, userEdition.value, metadataStore.editions)) {
          continue;
        }
        const task = metadataStore.getTaskById(need.taskId);
        if (task && task.factionName !== 'Any' && task.factionName !== userFaction.value) {
          continue;
        }
        itemId = getNeededItemId(need);
        if (!itemId) {
          logger.warn('[NeededItems] Skipping objective without item/markerItem:', need);
          continue;
        }
        key = `task:${need.taskId}:${itemId}`;
      } else {
        itemId = getNeededItemId(need);
        if (!itemId) {
          logger.warn('[NeededItems] Skipping hideout requirement without item:', need);
          continue;
        }
        key = `hideout:${need.hideoutModule.id}:${itemId}`;
      }
      const existing = aggregated.get(key);
      const normalizedCount = need.count ?? 0;
      if (existing) {
        const newCount = (existing.count ?? 0) + normalizedCount;
        aggregated.set(key, { ...existing, count: newCount });
      } else {
        aggregated.set(key, { ...need, count: normalizedCount });
      }
    }
    return Array.from(aggregated.values());
  });
  const isParentCompleted = (need: NeededItemTaskObjective | NeededItemHideoutModule): boolean => {
    if (need.needType === 'taskObjective') {
      return progressStore.tasksCompletions?.[need.taskId]?.['self'] ?? false;
    } else if (need.needType === 'hideoutModule') {
      return progressStore.moduleCompletions?.[need.hideoutModule.id]?.['self'] ?? false;
    }
    return false;
  };
  const filterTabsWithCounts = computed((): FilterTab[] => {
    const counts = { tasks: 0, hideout: 0, completed: 0, incomplete: 0 };
    for (const item of allItems.value) {
      const completed = isParentCompleted(item);
      if (completed) {
        counts.completed++;
      } else {
        counts.incomplete++;
        if (item.needType === 'taskObjective') counts.tasks++;
        else counts.hideout++;
      }
    }
    return [
      {
        label: translate('neededItems.filters.all'),
        value: 'all' as NeededItemsFilterType,
        icon: 'i-mdi-clipboard-list',
        count: counts.incomplete,
      },
      {
        label: translate('neededItems.filters.tasks'),
        value: 'tasks' as NeededItemsFilterType,
        icon: 'i-mdi-checkbox-marked-circle-outline',
        count: counts.tasks,
      },
      {
        label: translate('neededItems.filters.hideout'),
        value: 'hideout' as NeededItemsFilterType,
        icon: 'i-mdi-home',
        count: counts.hideout,
      },
      {
        label: translate('neededItems.filters.completed'),
        value: 'completed' as NeededItemsFilterType,
        icon: 'i-mdi-check-all',
        count: counts.completed,
      },
    ];
  });
  const filteredItems = computed(() => {
    let result = allItems.value;
    if (activeFilter.value === 'completed') {
      result = result.filter((item) => isParentCompleted(item));
    } else {
      result = result.filter((item) => !isParentCompleted(item));
      if (activeFilter.value === 'tasks') {
        result = result.filter((item) => item.needType === 'taskObjective');
      } else if (activeFilter.value === 'hideout') {
        result = result.filter((item) => item.needType === 'hideoutModule');
      }
    }
    if (firFilter.value === 'fir') {
      result = result.filter((item) => item.foundInRaid === true);
    } else if (firFilter.value === 'non-fir') {
      result = result.filter((item) => !item.foundInRaid);
    }
    const applySpecialEquipmentFilter =
      hideNonFirSpecialEquipment.value && itemsFullLoaded.value === true;
    const passesSpecialEquipmentFilter = (
      need: NeededItemTaskObjective | NeededItemHideoutModule
    ) =>
      need.needType !== 'taskObjective' ||
      !applySpecialEquipmentFilter ||
      !isNonFirSpecialEquipment(need as NeededItemTaskObjective);
    result = result.filter(passesSpecialEquipmentFilter);
    if (kappaOnly.value) {
      result = result.filter((need) => {
        if (need.needType !== 'taskObjective') {
          return true;
        }
        const task = metadataStore.getTaskById(need.taskId);
        return task?.kappaRequired === true;
      });
    }
    if (hideOwned.value) {
      result = result.filter((item) => {
        const count = item.count || 1;
        let current = 0;
        if (item.needType === 'taskObjective') {
          current = tarkovStore.getObjectiveCount(item.id);
        } else {
          current = tarkovStore.getHideoutPartCount(item.id);
        }
        return current < count;
      });
    }
    if (hideTeamItems.value) {
      result = result.filter((item) => {
        const teamId = getNeedTeamId(item);
        if (!teamId || teamId === 'self') {
          return true;
        }
        return progressStore.getTeamIndex(teamId) === 'self';
      });
    }
    if (search.value) {
      result = result.filter((item) => {
        const itemObj = getNeededItemData(item);
        const itemName = itemObj?.name ?? '';
        const itemShortName = itemObj?.shortName ?? '';
        if (fuzzyMatch(itemName, search.value) || fuzzyMatch(itemShortName, search.value)) {
          return true;
        }
        if (item.needType === 'taskObjective') {
          const task = metadataStore.getTaskById((item as NeededItemTaskObjective).taskId);
          if (task?.name && fuzzyMatch(task.name, search.value)) {
            return true;
          }
        }
        if (item.needType === 'hideoutModule') {
          const hideoutModule = (item as NeededItemHideoutModule).hideoutModule;
          const station = metadataStore.getStationById(hideoutModule.stationId);
          if (station?.name) {
            if (fuzzyMatch(station.name, search.value)) {
              return true;
            }
            const stationWithLevel = `${station.name} ${hideoutModule.level}`;
            const stationWithLevelText = `${station.name} level ${hideoutModule.level}`;
            if (
              fuzzyMatch(stationWithLevel, search.value) ||
              fuzzyMatch(stationWithLevelText, search.value)
            ) {
              return true;
            }
          }
        }
        return false;
      });
    }
    return sortNeededItems(result);
  });
  type GroupedNeededItemAccumulator = Omit<GroupedNeededItem, 'total' | 'currentCount'>;
  const groupedItems = computed((): GroupedNeededItem[] => {
    const groups = new Map<string, GroupedNeededItemAccumulator>();
    for (const need of filteredItems.value) {
      const itemId = getNeededItemId(need);
      if (!itemId) continue;
      const itemData = getNeededItemData(need);
      if (!itemData || !itemData.name) continue;
      const existingGroup = groups.get(itemId);
      if (!existingGroup) {
        groups.set(itemId, {
          item: {
            id: itemData.id,
            name: itemData.name,
            iconLink: itemData.iconLink,
            image512pxLink: itemData.image512pxLink,
            wikiLink: itemData.wikiLink,
            link: itemData.link,
          },
          taskFir: 0,
          taskFirCurrent: 0,
          taskNonFir: 0,
          taskNonFirCurrent: 0,
          hideoutFir: 0,
          hideoutFirCurrent: 0,
          hideoutNonFir: 0,
          hideoutNonFirCurrent: 0,
        });
      }
      const group = groups.get(itemId)!;
      const count = need.count || 1;
      let needCurrentCount = 0;
      if (need.needType === 'taskObjective') {
        const objectiveCount = tarkovStore.getObjectiveCount(need.id);
        needCurrentCount = Math.min(objectiveCount ?? 0, count);
        if (need.foundInRaid) {
          group.taskFir += count;
          group.taskFirCurrent += needCurrentCount;
        } else {
          group.taskNonFir += count;
          group.taskNonFirCurrent += needCurrentCount;
        }
      } else {
        const hideoutPartCount = tarkovStore.getHideoutPartCount(need.id);
        needCurrentCount = Math.min(hideoutPartCount ?? 0, count);
        if (need.foundInRaid) {
          group.hideoutFir += count;
          group.hideoutFirCurrent += needCurrentCount;
        } else {
          group.hideoutNonFir += count;
          group.hideoutNonFirCurrent += needCurrentCount;
        }
      }
    }
    const mapped = Array.from(groups.values()).map((group) => ({
      ...group,
      total: group.taskFir + group.taskNonFir + group.hideoutFir + group.hideoutNonFir,
      currentCount:
        group.taskFirCurrent +
        group.taskNonFirCurrent +
        group.hideoutFirCurrent +
        group.hideoutNonFirCurrent,
    }));
    return sortGroupedItems(mapped);
  });
  const objectivesByItemId = computed(() => {
    const map = new Map<
      string,
      {
        taskObjectives: NeededItemTaskObjective[];
        hideoutModules: NeededItemHideoutModule[];
      }
    >();
    for (const need of filteredItems.value) {
      const itemData = getNeededItemData(need);
      const itemId = itemData?.id;
      if (!itemId) continue;
      if (!map.has(itemId)) {
        map.set(itemId, { taskObjectives: [], hideoutModules: [] });
      }
      const entry = map.get(itemId)!;
      if (need.needType === 'taskObjective') {
        entry.taskObjectives.push(need as NeededItemTaskObjective);
      } else {
        entry.hideoutModules.push(need as NeededItemHideoutModule);
      }
    }
    return map;
  });
  const displayItems = computed(() => {
    if (groupByItem.value) {
      return groupedItems.value;
    }
    return filteredItems.value;
  });
  return {
    activeFilter,
    firFilter,
    groupByItem,
    hideNonFirSpecialEquipment,
    hideTeamItems,
    kappaOnly,
    hideOwned,
    sortBy,
    sortDirection,
    viewMode,
    cardStyle,
    allItems,
    filteredItems,
    groupedItems,
    displayItems,
    objectivesByItemId,
    filterTabsWithCounts,
    itemsReady,
    itemsError,
    itemsFullLoaded,
    ensureNeededItemsData,
    queueFullItemsLoad,
  };
}
