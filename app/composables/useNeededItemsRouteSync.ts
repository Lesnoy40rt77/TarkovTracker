import { logger } from '@/utils/logger';
import { getQueryString, normalizeQuery } from '@/utils/routeHelpers';
import type { Ref } from '#imports';
import type { NeededItemsFilterType } from '@/features/neededitems/neededitems-constants';
import type { LocationQuery, LocationQueryRaw } from 'vue-router';
const NEEDED_ITEMS_FILTER_QUERY_KEY = 'type';
const NEEDED_ITEMS_FILTER_TYPES = ['all', 'tasks', 'hideout', 'completed'] as const;
const isValidFilterType = (value: string | undefined): value is NeededItemsFilterType => {
  return (
    !!value &&
    NEEDED_ITEMS_FILTER_TYPES.includes(value as (typeof NEEDED_ITEMS_FILTER_TYPES)[number])
  );
};
const buildFilterQuery = (
  currentQuery: LocationQuery,
  filter: NeededItemsFilterType
): LocationQueryRaw => {
  return {
    ...currentQuery,
    [NEEDED_ITEMS_FILTER_QUERY_KEY]: filter,
  };
};
export type UseNeededItemsRouteSyncOptions = {
  activeFilter: Ref<NeededItemsFilterType>;
};
export interface UseNeededItemsRouteSyncReturn {
  isSyncingFromRoute: Ref<boolean>;
  isSyncingToRoute: Ref<boolean>;
}
export function useNeededItemsRouteSync({
  activeFilter,
}: UseNeededItemsRouteSyncOptions): UseNeededItemsRouteSyncReturn {
  const route = useRoute();
  const router = useRouter();
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
        logger.error('[useNeededItemsRouteSync] Navigation failed:', error);
      })
      .finally(() => {
        isSyncingToRoute.value = false;
      });
  };
  const syncStateFromRoute = () => {
    if (isSyncingToRoute.value) return;
    const filterParam = getQueryString(route.query[NEEDED_ITEMS_FILTER_QUERY_KEY]);
    const normalizedFilter = isValidFilterType(filterParam) ? filterParam : undefined;
    if (!hasInitializedRouteSync.value) {
      hasInitializedRouteSync.value = true;
      if (!normalizedFilter) {
        syncRoute(buildFilterQuery(route.query, activeFilter.value), true);
        return;
      }
    }
    const targetFilter = normalizedFilter ?? 'all';
    if (targetFilter === activeFilter.value) return;
    isSyncingFromRoute.value = true;
    activeFilter.value = targetFilter;
    isSyncingFromRoute.value = false;
  };
  watch(
    () => route.query[NEEDED_ITEMS_FILTER_QUERY_KEY],
    () => {
      syncStateFromRoute();
    },
    { immediate: true }
  );
  watch(
    activeFilter,
    (nextFilter, previousFilter) => {
      if (isSyncingFromRoute.value) return;
      const shouldReplace = nextFilter === previousFilter;
      syncRoute(buildFilterQuery(route.query, nextFilter), shouldReplace);
    },
    { flush: 'post' }
  );
  return {
    isSyncingFromRoute,
    isSyncingToRoute,
  };
}
