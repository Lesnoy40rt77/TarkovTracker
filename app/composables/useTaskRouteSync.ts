import { storeToRefs } from 'pinia';
import { usePreferencesStore } from '@/stores/usePreferences';
import { isValidPrimaryView } from '@/types/taskFilter';
import { logger } from '@/utils/logger';
import { getQueryString } from '@/utils/routeHelpers';
import type { Ref } from '#imports';
import type { TarkovMap, Trader } from '@/types/tarkov';
import type { TaskPrimaryView } from '@/types/taskFilter';
import type { LocationQuery, LocationQueryRaw } from 'vue-router';
export type UseTaskRouteSyncOptions = {
  maps: Ref<TarkovMap[]>;
  traders: Ref<Trader[]>;
};
export interface UseTaskRouteSyncReturn {
  isSyncingFromRoute: Ref<boolean>;
  isSyncingToRoute: Ref<boolean>;
}
type QueryLike = LocationQuery | LocationQueryRaw;
type MapWithMergedIds = TarkovMap & {
  mergedIds?: string[];
};
const normalizeQuery = (query: QueryLike): string => {
  const normalized: Record<string, string> = {};
  Object.keys(query)
    .sort()
    .forEach((key) => {
      const value = query[key];
      if (value === undefined || value === null || value === '') return;
      if (Array.isArray(value)) {
        const entries = value.filter(
          (entry): entry is string | number => entry !== undefined && entry !== null
        );
        const nonEmptyEntries = entries.filter((entry) =>
          typeof entry === 'string' ? entry !== '' : true
        );
        if (nonEmptyEntries.length === 0) return;
        normalized[key] = nonEmptyEntries.map(String).join(',');
        return;
      }
      normalized[key] = String(value);
    });
  return JSON.stringify(normalized);
};
const buildViewQuery = (
  currentQuery: LocationQuery,
  primaryView: TaskPrimaryView,
  mapView: string,
  traderView: string
): LocationQueryRaw => {
  const nextQuery: LocationQueryRaw = { ...currentQuery };
  if (primaryView === 'maps') {
    nextQuery.view = 'maps';
    nextQuery.map = mapView !== 'all' ? mapView : undefined;
    nextQuery.trader = undefined;
    return nextQuery;
  }
  if (primaryView === 'traders') {
    nextQuery.view = 'traders';
    nextQuery.trader = traderView !== 'all' ? traderView : undefined;
    nextQuery.map = undefined;
    return nextQuery;
  }
  nextQuery.view = 'all';
  nextQuery.map = undefined;
  nextQuery.trader = undefined;
  return nextQuery;
};
const getMergedMapIds = (map: TarkovMap): string[] => {
  const mergedIds = (map as MapWithMergedIds).mergedIds;
  if (!Array.isArray(mergedIds) || mergedIds.length === 0) {
    return [map.id];
  }
  return mergedIds.includes(map.id) ? mergedIds : [map.id, ...mergedIds];
};
const resolveMapIdFromRoute = (
  maps: TarkovMap[],
  mapParam: string | undefined
): string | undefined => {
  const firstMapId = maps[0]?.id;
  if (!mapParam) return firstMapId;
  if (maps.some((map) => map.id === mapParam)) {
    return mapParam;
  }
  const mergedMapMatch = maps.find((map) => getMergedMapIds(map).includes(mapParam));
  return mergedMapMatch?.id ?? firstMapId;
};
export function useTaskRouteSync({
  maps,
  traders,
}: UseTaskRouteSyncOptions): UseTaskRouteSyncReturn {
  const route = useRoute();
  const router = useRouter();
  const preferencesStore = usePreferencesStore();
  const { getTaskPrimaryView, getTaskMapView, getTaskTraderView } = storeToRefs(preferencesStore);
  const isSyncingFromRoute = ref(false);
  const isSyncingToRoute = ref(false);
  const hasInitializedRouteSync = ref(false);
  const syncRoute = (nextQuery: LocationQueryRaw, replace = false) => {
    if (isSyncingToRoute.value) return;
    if (normalizeQuery(route.query) === normalizeQuery(nextQuery)) return;
    isSyncingToRoute.value = true;
    const method = replace ? 'replace' : 'push';
    router[method]({ query: nextQuery })
      .catch((error) => {
        logger.error('[useTaskRouteSync] Navigation failed:', error);
      })
      .finally(() => {
        isSyncingToRoute.value = false;
      });
  };
  const syncStateFromRoute = () => {
    if (isSyncingToRoute.value) return;
    const viewParam = getQueryString(route.query.view);
    const mapParam = getQueryString(route.query.map);
    const traderParam = getQueryString(route.query.trader);
    const normalizedView = isValidPrimaryView(viewParam) ? viewParam : undefined;
    if (!hasInitializedRouteSync.value) {
      hasInitializedRouteSync.value = true;
      if (!normalizedView) {
        const storedView = isValidPrimaryView(preferencesStore.getTaskPrimaryView)
          ? preferencesStore.getTaskPrimaryView
          : 'all';
        syncRoute(
          buildViewQuery(
            route.query,
            storedView,
            preferencesStore.getTaskMapView,
            preferencesStore.getTaskTraderView
          ),
          true
        );
        return;
      }
    }
    const targetView = normalizedView ?? 'all';
    isSyncingFromRoute.value = true;
    if (targetView !== preferencesStore.getTaskPrimaryView) {
      preferencesStore.setTaskPrimaryView(targetView);
    }
    if (targetView === 'maps') {
      if (maps.value.length === 0) {
        logger.debug('[useTaskRouteSync] Delaying map preference sync until maps are loaded.', {
          targetView,
          mapParam,
        });
      } else {
        const mapId = resolveMapIdFromRoute(maps.value, mapParam);
        if (mapId && mapId !== preferencesStore.getTaskMapView) {
          preferencesStore.setTaskMapView(mapId);
        }
      }
    }
    if (targetView === 'traders') {
      if (traders.value.length === 0) {
        logger.debug(
          '[useTaskRouteSync] Delaying trader preference sync until traders are loaded.',
          {
            targetView,
            traderParam,
          }
        );
      } else {
        const firstTraderId = traders.value[0]?.id;
        const traderId = traders.value.some((trader) => trader.id === traderParam)
          ? traderParam
          : firstTraderId;
        if (traderId && traderId !== preferencesStore.getTaskTraderView) {
          preferencesStore.setTaskTraderView(traderId);
        }
      }
    }
    isSyncingFromRoute.value = false;
  };
  let syncStateFromRouteTimeout: ReturnType<typeof setTimeout> | null = null;
  const debouncedSyncStateFromRoute = () => {
    if (syncStateFromRouteTimeout) {
      clearTimeout(syncStateFromRouteTimeout);
    }
    syncStateFromRouteTimeout = setTimeout(() => {
      syncStateFromRouteTimeout = null;
      syncStateFromRoute();
    }, 200);
  };
  onBeforeUnmount(() => {
    if (!syncStateFromRouteTimeout) return;
    clearTimeout(syncStateFromRouteTimeout);
    syncStateFromRouteTimeout = null;
  });
  watch(
    [
      () => route.query.view,
      () => route.query.map,
      () => route.query.trader,
      () => maps.value.length,
      () => traders.value.length,
    ],
    () => {
      debouncedSyncStateFromRoute();
    },
    { immediate: true }
  );
  watch(
    [getTaskPrimaryView, getTaskMapView, getTaskTraderView],
    ([primaryView, mapView, traderView], prevValues) => {
      if (isSyncingFromRoute.value) return;
      const normalizedPrimary = isValidPrimaryView(primaryView) ? primaryView : 'all';
      const shouldDelayMapRouteSync =
        normalizedPrimary === 'maps' &&
        maps.value.length === 0 &&
        !!getQueryString(route.query.map);
      const shouldDelayTraderRouteSync =
        normalizedPrimary === 'traders' &&
        traders.value.length === 0 &&
        !!getQueryString(route.query.trader);
      if (shouldDelayMapRouteSync || shouldDelayTraderRouteSync) {
        return;
      }
      const prevPrimaryView = prevValues[0];
      const shouldReplace = normalizedPrimary === prevPrimaryView;
      syncRoute(buildViewQuery(route.query, normalizedPrimary, mapView, traderView), shouldReplace);
    },
    { flush: 'post' }
  );
  return {
    isSyncingFromRoute,
    isSyncingToRoute,
  };
}
