import { storeToRefs } from 'pinia';
import { usePreferencesStore } from '@/stores/usePreferences';
import { isValidPrimaryView } from '@/types/taskFilter';
import { logger } from '@/utils/logger';
import { getQueryString } from '@/utils/routeHelpers';
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
      const mapId = maps.value.some((map) => map.id === mapParam) ? mapParam : maps.value[0]?.id;
      if (mapId && mapId !== preferencesStore.getTaskMapView) {
        preferencesStore.setTaskMapView(mapId);
      }
    }
    if (targetView === 'traders') {
      const traderId = traders.value.some((trader) => trader.id === traderParam)
        ? traderParam
        : traders.value[0]?.id;
      if (traderId && traderId !== preferencesStore.getTaskTraderView) {
        preferencesStore.setTaskTraderView(traderId);
      }
    }
    isSyncingFromRoute.value = false;
  };
  watch(
    [
      () => route.query.view,
      () => route.query.map,
      () => route.query.trader,
      () => maps.value.length,
      () => traders.value.length,
    ],
    () => {
      syncStateFromRoute();
    },
    { immediate: true }
  );
  watch(
    [getTaskPrimaryView, getTaskMapView, getTaskTraderView],
    ([primaryView, mapView, traderView], [prevPrimaryView]) => {
      if (isSyncingFromRoute.value) return;
      const normalizedPrimary = isValidPrimaryView(primaryView) ? primaryView : 'all';
      const shouldReplace = normalizedPrimary === prevPrimaryView;
      syncRoute(buildViewQuery(route.query, normalizedPrimary, mapView, traderView), shouldReplace);
    }
  );
  return {
    isSyncingFromRoute,
    isSyncingToRoute,
  };
}
