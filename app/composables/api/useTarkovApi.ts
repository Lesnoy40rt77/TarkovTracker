import { ref, computed, watch, onMounted, type ComputedRef } from "vue";
import { useQuery, provideApolloClient } from "@vue/apollo-composable";
import { apolloClient } from "@/plugins/apollo";
import tarkovHideoutQuery from "@/utils/tarkovhideoutquery";
import gql from "graphql-tag";
import {
  useSafeLocale,
  extractLanguageCode,
} from "@/composables/utils/i18nHelpers";
import type {
  LanguageQueryResult,
  TarkovDataQueryResult,
  TarkovHideoutQueryResult,
  StaticMapData,
} from "@/types/tarkov";
import mapsData from "./maps.json";
import { API_GAME_MODES, GAME_MODES } from "@/utils/constants";

const languageQuery = gql`
  query GetLanguageCodes {
    __type(name: "LanguageCode") {
      enumValues {
        name
      }
    }
  }
`;
// Provide Apollo client
provideApolloClient(apolloClient);
// Singleton state for caching
const isInitialized = ref(false);
const availableLanguages = ref<string[] | null>(null);
const staticMapData = ref<StaticMapData | null>(null);
// Map data - now served locally
let mapPromise: Promise<StaticMapData> | null = null;
/**
 * Loads static map data from local source
 */
async function loadStaticMaps(): Promise<StaticMapData> {
  if (!mapPromise) {
    mapPromise = Promise.resolve(mapsData as StaticMapData);
  }
  return mapPromise;
}
// Language extraction moved to @/composables/utils/i18nHelpers.ts
/**
 * Composable for managing Tarkov API queries and language detection
 */
export function useTarkovApi() {
  // Use safe locale helper to avoid i18n context issues
  const locale = useSafeLocale();
  const languageCode = computed(() =>
    extractLanguageCode(locale.value, availableLanguages.value || ["en"])
  );
  // Load static map data on mount
  onMounted(async () => {
    if (!staticMapData.value) {
      staticMapData.value = await loadStaticMaps();
    }
  });
  // Initialize queries only once
  if (!isInitialized.value) {
    isInitialized.value = true;
    // Language Query - Get available languages
    const { onResult: onLanguageResult, onError: onLanguageError } =
      useQuery<LanguageQueryResult>(languageQuery, null, {
        fetchPolicy: "cache-first",
        notifyOnNetworkStatusChange: true,
        errorPolicy: "all",
      });
    onLanguageResult((result) => {
      availableLanguages.value = result.data?.__type?.enumValues.map(
        (enumValue: { name: string }) => enumValue.name
      ) ?? ["en"];
    });
    onLanguageError((error) => {
      console.error("Language query failed:", error);
      availableLanguages.value = ["en"];
    });
  }
  return {
    availableLanguages: availableLanguages,
    languageCode,
    staticMapData,
    loadStaticMaps,
  };
}
/**
 * Composable for Tarkov main data queries (tasks, maps, traders, player levels)
 */
export function useTarkovDataQuery(
  gameMode: ComputedRef<string> = computed(() => GAME_MODES.PVP)
) {
  // Get language code from the API composable to ensure consistency
  const { languageCode: apiLanguageCode } = useTarkovApi();
  const apiGameMode = computed(() => {
    const mode = gameMode.value as keyof typeof API_GAME_MODES;
    return API_GAME_MODES[mode] || API_GAME_MODES[GAME_MODES.PVP];
  });
  const { data, error, status, refresh } = useFetch<{
    data: TarkovDataQueryResult;
  }>("/api/tarkov/data", {
    query: computed(() => ({
      lang: apiLanguageCode.value,
      gameMode: apiGameMode.value,
    })),
    key: computed(
      () => `tarkov-data-${apiLanguageCode.value}-${apiGameMode.value}`
    ),
  });

  const result = computed(() => data.value?.data);
  const loading = computed(() => status.value === "pending");
  // Watch for language and gameMode changes and refetch
  watch(
    [apiLanguageCode, apiGameMode],
    ([newLang, newGameMode], [oldLang, oldGameMode]) => {
      if (
        (oldLang !== newLang || oldGameMode !== newGameMode) &&
        availableLanguages.value
      ) {
        refresh();
      }
    }
  );
  return {
    result,
    error,
    loading,
    refetch: refresh,
    languageCode: apiLanguageCode,
    gameMode,
  };
}
/**
 * Composable for Tarkov hideout data queries
 */
export function useTarkovHideoutQuery(
  gameMode: ComputedRef<string> = computed(() => GAME_MODES.PVP)
) {
  // Get language code from the API composable to ensure consistency
  const { languageCode: apiLanguageCode } = useTarkovApi();
  // Map internal game modes to API game modes
  const apiGameMode = computed(() => {
    const mode = gameMode.value as keyof typeof API_GAME_MODES;
    return API_GAME_MODES[mode] || API_GAME_MODES[GAME_MODES.PVP];
  });
  const { result, error, loading, refetch } = useQuery<
    TarkovHideoutQueryResult,
    { lang: string; gameMode: string }
  >(
    tarkovHideoutQuery,
    () => ({ lang: apiLanguageCode.value, gameMode: apiGameMode.value }),
    {
      fetchPolicy: "cache-and-network",
      notifyOnNetworkStatusChange: true,
      errorPolicy: "all",
      // Allow query to execute immediately, don't wait for availableLanguages
      // The languageCode computed will default to 'en' if languages aren't loaded yet
    }
  );
  // Watch for language and gameMode changes and refetch
  watch(
    [apiLanguageCode, apiGameMode],
    ([newLang, newGameMode], [oldLang, oldGameMode]) => {
      if (
        (oldLang !== newLang || oldGameMode !== newGameMode) &&
        availableLanguages.value
      ) {
        refetch({ lang: newLang, gameMode: newGameMode });
      }
    }
  );
  return {
    result,
    error,
    loading,
    refetch,
    languageCode: apiLanguageCode,
    gameMode,
  };
}
