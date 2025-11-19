import { computed, ref, watch } from "vue";
import { useTarkovApi } from "@/composables/api/useTarkovApi";
import { useTaskData } from "@/composables/data/useTaskData";
import { useHideoutData } from "@/composables/data/useHideoutData";
import {
  useMapData,
  useTraderData,
  usePlayerLevelData,
} from "@/composables/data/useMapData";
import type {
  TarkovDataComposable,
  Task,
  TaskObjective,
  TarkovMap,
  Trader,
  PlayerLevel,
  HideoutStation,
  HideoutModule,
  NeededItemTaskObjective,
  NeededItemHideoutModule,
} from "@/types/tarkov";
import type { AbstractGraph } from "graphology-types";
import { DISABLED_TASKS } from "@/utils/constants";
// Re-export the new modular composables for backward compatibility
export {
  useTarkovApi,
  useTarkovDataQuery,
  useTarkovHideoutQuery,
} from "@/composables/api/useTarkovApi";
export { useTaskData } from "@/composables/data/useTaskData";
export { useHideoutData } from "@/composables/data/useHideoutData";
export {
  useMapData,
  useTraderData,
  usePlayerLevelData,
} from "@/composables/data/useMapData";
// Re-export types for backward compatibility
export type { Task } from "@/types/tarkov";
// Global state variables for backward compatibility
// These will be initialized when useTarkovData is first called
let globalTaskData: ReturnType<typeof useTaskData> | null = null;
let globalHideoutData: ReturnType<typeof useHideoutData> | null = null;
let globalMapData: ReturnType<typeof useMapData> | null = null;
let globalTraderData: ReturnType<typeof useTraderData> | null = null;
let globalPlayerData: ReturnType<typeof usePlayerLevelData> | null = null;
let globalApiData: ReturnType<typeof useTarkovApi> | null = null;
// Initialize function to be called within setup context
function initializeGlobalData() {
  if (!globalTaskData) {
    globalTaskData = useTaskData();
    globalHideoutData = useHideoutData();
    globalMapData = useMapData();
    globalTraderData = useTraderData();
    globalPlayerData = usePlayerLevelData();
    globalApiData = useTarkovApi();

    // Sync global data to exported refs for backward compatibility
    watch(globalTaskData.tasks, (val) => (tasks.value = val));
    watch(globalTaskData.taskGraph, (val) => (taskGraph.value = val));
    watch(globalTaskData.objectiveMaps, (val) => (objectiveMaps.value = val));
    watch(
      globalTaskData.alternativeTasks,
      (val) => (alternativeTasks.value = val)
    );
    watch(globalTaskData.objectiveGPS, (val) => (objectiveGPS.value = val));
    watch(globalTaskData.mapTasks, (val) => (mapTasks.value = val));
    watch(globalTaskData.objectives, (val) => (objectives.value = val));
    watch(
      globalTaskData.neededItemTaskObjectives,
      (val) => (neededItemTaskObjectives.value = val)
    );
    watch(globalTaskData.loading, (val) => (loading.value = val));

    watch(
      globalHideoutData.hideoutStations,
      (val) => (hideoutStations.value = val)
    );
    watch(
      globalHideoutData.hideoutModules,
      (val) => (hideoutModules.value = val)
    );
    watch(globalHideoutData.hideoutGraph, (val) => (hideoutGraph.value = val));
    watch(
      globalHideoutData.neededItemHideoutModules,
      (val) => (neededItemHideoutModules.value = val)
    );
    watch(globalHideoutData.loading, (val) => (hideoutLoading.value = val));

    watch(globalTraderData.traders, (val) => (traders.value = val));
  }
}
// Re-export for backward compatibility - these will be empty until useTarkovData is called
export const hideoutStations = ref<HideoutStation[]>([]);
export const hideoutModules = ref<HideoutModule[]>([]);
export const hideoutGraph = ref<AbstractGraph | null>(null);
export const tasks = ref<Task[]>([]);
export const taskGraph = ref<AbstractGraph | null>(null);
export const objectiveMaps = ref<Record<string, unknown>>({});
export const alternativeTasks = ref<Record<string, unknown>>({});
export const objectiveGPS = ref<Record<string, unknown>>({});
export const mapTasks = ref<Record<string, unknown>>({});
export const neededItemTaskObjectives = ref<NeededItemTaskObjective[]>([]);
export const neededItemHideoutModules = ref<NeededItemHideoutModule[]>([]);
export const loading = ref<boolean>(false);
export const hideoutLoading = ref<boolean>(false);
export const traders = ref<Trader[]>([]);
export const objectives = ref<TaskObjective[]>([]);
const disabledTasks = DISABLED_TASKS;
const minPlayerLevel = ref<number>(1);
const maxPlayerLevel = ref<number>(79);
/**
 * Main composable that provides backward compatibility
 * while using the new modular structure under the hood
 */
export function useTarkovData(): TarkovDataComposable {
  // Initialize global data when called from a setup function
  initializeGlobalData();
  // Use the now-initialized global data
  const api = globalApiData!;
  const taskData = globalTaskData!;
  const hideoutData = globalHideoutData!;
  const mapData = globalMapData!;
  const traderData = globalTraderData!;
  const playerData = globalPlayerData!;

  // Return refs directly from child composables to preserve reactivity
  // DO NOT copy .value - that breaks reactivity!
  return {
    availableLanguages: api.availableLanguages,
    languageCode: api.languageCode,
    queryErrors: taskData.error,
    queryResults: computed(() => null), // Legacy field, not used in new structure
    lastQueryTime: computed(() => Date.now()), // Legacy field
    loading: taskData.loading,
    hideoutLoading: hideoutData.loading,
    queryHideoutErrors: hideoutData.error,
    queryHideoutResults: computed(() => null), // Legacy field
    lastHideoutQueryTime: computed(() => Date.now()), // Legacy field
    hideoutStations: hideoutData.hideoutStations,
    hideoutModules: hideoutData.hideoutModules,
    hideoutGraph: hideoutData.hideoutGraph,
    tasks: taskData.tasks,
    taskGraph: taskData.taskGraph,
    objectiveMaps: taskData.objectiveMaps,
    alternativeTasks: taskData.alternativeTasks,
    objectiveGPS: taskData.objectiveGPS,
    mapTasks: taskData.mapTasks,
    objectives: taskData.objectives,
    maps: mapData.maps,
    traders: traderData.traders,
    neededItemTaskObjectives: taskData.neededItemTaskObjectives,
    neededItemHideoutModules: hideoutData.neededItemHideoutModules,
    disabledTasks: disabledTasks,
    playerLevels: playerData.playerLevels,
    minPlayerLevel: playerData.minPlayerLevel,
    maxPlayerLevel: playerData.maxPlayerLevel,
  };
}
