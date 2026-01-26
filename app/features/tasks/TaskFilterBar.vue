<template>
  <div class="mb-6 space-y-3">
    <!-- Top Bar: Search (left) | Primary View Tabs (center) | Settings (right) -->
    <div
      class="bg-surface-900 flex items-center gap-3 rounded-lg border border-white/12 px-4 py-3 shadow-sm"
    >
      <!-- Search - larger width -->
      <div class="w-56 shrink-0 sm:w-64 lg:w-72">
        <UInput
          :model-value="searchQuery"
          :placeholder="t('page.tasks.search.placeholder', 'Search...')"
          :aria-label="t('page.tasks.search.ariaLabel', 'Search tasks')"
          icon="i-mdi-magnify"
          size="sm"
          :ui="{ trailing: 'pe-1' }"
          class="w-full"
          @update:model-value="$emit('update:searchQuery', $event)"
        >
          <template v-if="searchQuery?.length" #trailing>
            <UButton
              color="neutral"
              variant="link"
              size="xs"
              icon="i-mdi-close-circle"
              aria-label="Clear search"
              @click="$emit('update:searchQuery', '')"
            />
          </template>
        </UInput>
      </div>
      <!-- Primary View Tabs - centered -->
      <div class="flex flex-1 items-center justify-center gap-1">
        <UButton
          variant="ghost"
          color="neutral"
          size="sm"
          :aria-pressed="primaryView === 'all'"
          :class="primaryView === 'all' ? 'bg-white/10 text-white' : 'text-surface-400'"
          @click="setPrimaryView('all')"
        >
          <UIcon name="i-mdi-checkbox-multiple-marked" class="h-4 w-4 sm:mr-1.5" />
          <span class="hidden text-xs sm:inline">
            {{ t('page.tasks.primaryviews.all').toUpperCase() }}
          </span>
        </UButton>
        <UButton
          variant="ghost"
          color="neutral"
          size="sm"
          :aria-pressed="primaryView === 'traders'"
          :class="primaryView === 'traders' ? 'bg-white/10 text-white' : 'text-surface-400'"
          @click="setPrimaryView('traders')"
        >
          <UIcon name="i-mdi-account-group" class="h-4 w-4 sm:mr-1.5" />
          <span class="hidden text-xs sm:inline">
            {{ t('page.tasks.primaryviews.traders').toUpperCase() }}
          </span>
        </UButton>
        <UButton
          variant="ghost"
          color="neutral"
          size="sm"
          :aria-pressed="primaryView === 'maps'"
          :class="primaryView === 'maps' ? 'bg-white/10 text-white' : 'text-surface-400'"
          @click="setPrimaryView('maps')"
        >
          <UIcon name="i-mdi-map" class="h-4 w-4 sm:mr-1.5" />
          <span class="hidden text-xs sm:inline">
            {{ t('page.tasks.primaryviews.maps').toUpperCase() }}
          </span>
        </UButton>
      </div>
      <!-- Sort + Settings -->
      <div class="flex shrink-0 items-center gap-2">
        <SelectMenuFixed
          v-model="taskSortMode"
          :items="sortOptions"
          value-key="value"
          size="sm"
          class="w-36 sm:w-44"
        >
          <template #leading>
            <UIcon :name="currentSortIcon" class="h-4 w-4" />
          </template>
          <template #item="{ item }">
            <div class="flex items-center gap-2">
              <UIcon :name="item.icon" class="h-4 w-4" />
              <span>{{ item.label }}</span>
            </div>
          </template>
        </SelectMenuFixed>
        <UButton
          color="neutral"
          variant="ghost"
          size="sm"
          :icon="sortDirectionIcon"
          :aria-label="sortDirectionLabel"
          @click="toggleSortDirection"
        />
        <!-- Filters toggle button -->
        <UButton
          color="neutral"
          variant="ghost"
          size="sm"
          :icon="filtersVisible ? 'i-mdi-chevron-up' : 'i-mdi-filter-variant'"
          :aria-label="filtersVisible ? 'Hide filters' : 'Show filters'"
          :class="{ 'text-info-400': filtersVisible }"
          @click="filtersVisible = !filtersVisible"
        />
        <UButton
          variant="ghost"
          color="neutral"
          size="sm"
          :class="isDrawerOpen ? 'bg-white/10 text-white' : 'text-surface-400'"
          @click="toggleDrawer"
        >
          <UIcon name="i-mdi-tune" class="h-4 w-4 sm:mr-1.5" />
          <span class="hidden text-xs sm:inline">SETTINGS</span>
        </UButton>
      </div>
    </div>
    <!-- Secondary filters (collapsible) -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform opacity-0 -translate-y-2"
      enter-to-class="transform opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="transform opacity-100 translate-y-0"
      leave-to-class="transform opacity-0 -translate-y-2"
    >
      <div v-if="filtersVisible" class="space-y-3">
        <!-- Status Filters + User View -->
        <div
          class="bg-surface-900 flex flex-wrap items-center justify-center gap-3 rounded-lg border border-white/12 px-4 py-3 shadow-sm"
        >
          <!-- Status filters -->
          <div class="flex items-center gap-1">
            <UButton
              v-if="preferencesStore.getShowAllFilter"
              variant="ghost"
              color="neutral"
              size="sm"
              :aria-pressed="secondaryView === 'all'"
              :class="secondaryView === 'all' ? 'bg-white/10 text-white' : 'text-surface-400'"
              @click="setSecondaryView('all')"
            >
              <UIcon name="i-mdi-format-list-bulleted" class="hidden h-4 w-4 sm:mr-1 sm:block" />
              <span class="text-xs sm:text-sm">ALL</span>
              <span
                class="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold text-white"
                :class="statusCounts.all > 0 ? 'bg-surface-500' : 'bg-surface-600'"
              >
                {{ statusCounts.all }}
              </span>
            </UButton>
            <UButton
              v-if="preferencesStore.getShowAvailableFilter"
              variant="ghost"
              color="neutral"
              size="sm"
              :aria-pressed="secondaryView === 'available'"
              :class="secondaryView === 'available' ? 'bg-white/10 text-white' : 'text-surface-400'"
              @click="setSecondaryView('available')"
            >
              <UIcon name="i-mdi-clipboard-text" class="hidden h-4 w-4 sm:mr-1 sm:block" />
              <span class="text-xs sm:text-sm">
                {{ t('page.tasks.secondaryviews.available').toUpperCase() }}
              </span>
              <span
                class="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold text-white"
                :class="statusCounts.available > 0 ? 'bg-info-500' : 'bg-surface-600'"
              >
                {{ statusCounts.available }}
              </span>
            </UButton>
            <UButton
              v-if="preferencesStore.getShowLockedFilter"
              variant="ghost"
              color="neutral"
              size="sm"
              :aria-pressed="secondaryView === 'locked'"
              :class="secondaryView === 'locked' ? 'bg-white/10 text-white' : 'text-surface-400'"
              @click="setSecondaryView('locked')"
            >
              <UIcon name="i-mdi-lock" class="hidden h-4 w-4 sm:mr-1 sm:block" />
              <span class="text-xs sm:text-sm">
                {{ t('page.tasks.secondaryviews.locked').toUpperCase() }}
              </span>
              <span
                class="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold text-white"
                :class="statusCounts.locked > 0 ? 'bg-surface-600' : 'bg-surface-700'"
              >
                {{ statusCounts.locked }}
              </span>
            </UButton>
            <UButton
              v-if="preferencesStore.getShowCompletedFilter"
              variant="ghost"
              color="neutral"
              size="sm"
              :aria-pressed="secondaryView === 'completed'"
              :class="secondaryView === 'completed' ? 'bg-white/10 text-white' : 'text-surface-400'"
              @click="setSecondaryView('completed')"
            >
              <UIcon name="i-mdi-check-circle" class="hidden h-4 w-4 sm:mr-1 sm:block" />
              <span class="text-xs sm:text-sm">
                {{ t('page.tasks.secondaryviews.completed').toUpperCase() }}
              </span>
              <span
                class="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold text-white"
                :class="statusCounts.completed > 0 ? 'bg-success-500' : 'bg-surface-600'"
              >
                {{ statusCounts.completed }}
              </span>
            </UButton>
            <UButton
              v-if="preferencesStore.getShowFailedFilter"
              variant="ghost"
              color="neutral"
              size="sm"
              :aria-pressed="secondaryView === 'failed'"
              :class="secondaryView === 'failed' ? 'bg-white/10 text-white' : 'text-surface-400'"
              @click="setSecondaryView('failed')"
            >
              <UIcon name="i-mdi-close-circle" class="hidden h-4 w-4 sm:mr-1 sm:block" />
              <span class="text-xs sm:text-sm">
                {{ t('page.tasks.secondaryviews.failed', 'FAILED').toUpperCase() }}
              </span>
              <span
                class="bg-error-500 ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold text-white"
              >
                {{ statusCounts.failed }}
              </span>
            </UButton>
          </div>
          <!-- Divider -->
          <div class="hidden h-6 w-px shrink-0 bg-white/20 sm:block" />
          <!-- Player/Team view buttons -->
          <div class="flex items-center gap-1">
            <UButton
              variant="ghost"
              color="neutral"
              size="sm"
              :aria-pressed="preferencesStore.getTaskUserView === 'self'"
              :class="
                preferencesStore.getTaskUserView === 'self'
                  ? 'bg-white/10 text-white'
                  : 'text-surface-400'
              "
              @click="onUserViewSelect({ label: currentUserDisplayName, value: 'self' })"
            >
              <UIcon name="i-mdi-account-circle" class="h-4 w-4 sm:mr-1" />
              <span class="hidden text-xs sm:inline sm:text-sm">
                {{ currentUserDisplayName.toUpperCase() }}
              </span>
              <UBadge size="xs" color="primary" variant="solid" class="ml-1">YOU</UBadge>
            </UButton>
            <UButton
              v-for="teamId in visibleTeammates"
              :key="teamId"
              variant="ghost"
              color="neutral"
              size="sm"
              :aria-pressed="preferencesStore.getTaskUserView === teamId"
              :class="
                preferencesStore.getTaskUserView === teamId
                  ? 'bg-white/10 text-white'
                  : 'text-surface-400'
              "
              @click="onUserViewSelect({ label: getTeammateDisplayName(teamId), value: teamId })"
            >
              <UIcon name="i-mdi-account" class="h-4 w-4 sm:mr-1" />
              <span class="text-xs sm:text-sm">
                {{ getTeammateDisplayName(teamId).toUpperCase() }}
              </span>
            </UButton>
            <UButton
              v-if="visibleTeammates.length > 0"
              variant="ghost"
              color="neutral"
              size="sm"
              :aria-pressed="preferencesStore.getTaskUserView === 'all'"
              :class="
                preferencesStore.getTaskUserView === 'all'
                  ? 'bg-white/10 text-white'
                  : 'text-surface-400'
              "
              @click="onUserViewSelect({ label: t('page.tasks.userviews.all'), value: 'all' })"
            >
              <UIcon name="i-mdi-account-multiple" class="h-4 w-4 sm:mr-1" />
              <span class="text-xs sm:text-sm">
                {{ t('page.tasks.userviews.all').toUpperCase() }}
              </span>
            </UButton>
          </div>
        </div>
        <!-- Map selector (shown when MAPS is selected) -->
        <div v-if="primaryView === 'maps' && maps.length > 0" class="w-full overflow-x-auto">
          <div
            class="bg-surface-900 flex w-max min-w-full justify-center gap-1 rounded-lg border border-white/12 px-4 py-3 shadow-sm"
          >
            <button
              v-for="mapOption in mapOptions"
              :key="mapOption.value"
              type="button"
              :aria-pressed="preferencesStore.getTaskMapView === mapOption.value"
              :class="[
                'flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors',
                'hover:bg-white/5',
                'focus:ring-primary-500 focus:ring-1 focus:outline-none',
                preferencesStore.getTaskMapView === mapOption.value
                  ? 'bg-white/10 text-white'
                  : 'text-surface-400 hover:text-white',
              ]"
              @click="onMapSelect(mapOption)"
            >
              <span class="whitespace-nowrap">{{ mapOption.label }}</span>
              <span
                :class="[
                  'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold text-white',
                  (mapOption.count ?? 0) > 0 ? 'bg-pve-500' : 'bg-surface-600',
                ]"
              >
                {{ mapOption.count ?? 0 }}
              </span>
            </button>
          </div>
        </div>
        <!-- Trader selector (shown when TRADERS is selected) -->
        <div v-if="primaryView === 'traders' && traders.length > 0" class="w-full overflow-x-auto">
          <div
            class="bg-surface-900 flex w-max min-w-full justify-center gap-1 rounded-lg border border-white/12 px-4 py-3 shadow-sm"
          >
            <button
              v-for="trader in traders"
              :key="trader.id"
              type="button"
              :aria-pressed="preferencesStore.getTaskTraderView === trader.id"
              :class="[
                'flex items-center gap-2 rounded-md px-3 py-2 transition-colors',
                'hover:bg-white/5',
                'focus:ring-primary-500 focus:ring-1 focus:outline-none',
                preferencesStore.getTaskTraderView === trader.id
                  ? 'bg-white/10 text-white'
                  : 'text-surface-400 hover:text-white',
              ]"
              @click="onTraderSelect({ label: trader.name, value: trader.id })"
            >
              <!-- Trader avatar with count badge -->
              <div class="relative">
                <div class="bg-surface-800 h-8 w-8 overflow-hidden rounded-full">
                  <img
                    v-if="trader.imageLink"
                    :src="trader.imageLink"
                    :alt="trader.name"
                    class="h-full w-full object-cover"
                  />
                  <UIcon
                    v-else
                    name="i-mdi-account-circle"
                    class="text-surface-500 h-full w-full"
                  />
                </div>
                <span
                  :class="[
                    'absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-0.5 text-[10px] font-bold text-white',
                    (traderCounts[trader.id] ?? 0) > 0 ? 'bg-pve-500' : 'bg-surface-600',
                  ]"
                >
                  {{ traderCounts[trader.id] ?? 0 }}
                </span>
              </div>
              <span class="text-xs font-medium whitespace-nowrap">{{ trader.name }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
<script setup lang="ts">
  import { useWindowSize } from '@vueuse/core';
  import { computed, ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useTaskFiltering } from '@/composables/useTaskFiltering';
  import { useTaskSettingsDrawer } from '@/composables/useTaskSettingsDrawer';
  import { useMetadataStore } from '@/stores/useMetadata';
  import { usePreferencesStore } from '@/stores/usePreferences';
  import { useProgressStore } from '@/stores/useProgress';
  import { useTeamStore } from '@/stores/useTeamStore';
  import { TASK_SORT_MODES, type TaskSortDirection, type TaskSortMode } from '@/types/taskSort';
  defineProps<{
    searchQuery: string;
  }>();
  defineEmits<{
    'update:searchQuery': [value: string];
  }>();
  const { t } = useI18n({ useScope: 'global' });
  const preferencesStore = usePreferencesStore();
  const metadataStore = useMetadataStore();
  const progressStore = useProgressStore();
  const teamStore = useTeamStore();
  const { width } = useWindowSize();
  const belowMd = computed(() => width.value < 768);
  // Filter visibility - hidden by default on mobile
  const filtersVisible = ref(!belowMd.value);
  // Settings drawer state
  const { isOpen: isDrawerOpen, toggle: toggleDrawer } = useTaskSettingsDrawer();
  const { calculateMapTaskTotals, calculateStatusCounts, calculateTraderCounts } =
    useTaskFiltering();
  const maps = computed(() => metadataStore.mapsWithSvg);
  const traders = computed(() =>
    metadataStore.sortedTraders.filter((trader) =>
      metadataStore.tasks.some((task) => task.trader?.id === trader.id)
    )
  );
  // Get current user's display name
  const currentUserDisplayName = computed(() => {
    return progressStore.getDisplayName('self');
  });
  // Get visible teammates (excluding self)
  const visibleTeammates = computed(() => {
    return teamStore.teammates || [];
  });
  // Helper to get teammate display name
  const getTeammateDisplayName = (teamId: string): string => {
    return progressStore.getDisplayName(teamId);
  };
  // Calculate task counts for badges
  const statusCounts = computed(() => {
    const userView = preferencesStore.getTaskUserView;
    return calculateStatusCounts(userView);
  });
  type SortOption = {
    value: TaskSortMode;
    label: string;
    icon: string;
  };
  const SORT_MODE_ICONS: Record<TaskSortMode, string> = {
    none: 'i-mdi-sort',
    impact: 'i-mdi-chart-line',
    alphabetical: 'i-mdi-sort-alphabetical-ascending',
    level: 'i-mdi-sort-numeric-ascending',
    trader: 'i-mdi-account',
    teammates: 'i-mdi-account-multiple',
    xp: 'i-mdi-star',
  };
  const SORT_MODE_FALLBACK_LABELS: Record<TaskSortMode, string> = {
    none: 'Default order',
    impact: 'Impact',
    alphabetical: 'Alphabetical',
    level: 'Level required',
    trader: 'Trader order',
    teammates: 'Teammates available',
    xp: 'XP Reward',
  };
  const sortOptions = computed<SortOption[]>(() =>
    TASK_SORT_MODES.map((mode) => ({
      value: mode,
      label: t(`page.tasks.sort.${mode}`, SORT_MODE_FALLBACK_LABELS[mode]),
      icon: SORT_MODE_ICONS[mode],
    }))
  );
  const validSortModes = new Set<TaskSortMode>(TASK_SORT_MODES);
  /**
   * Normalize sort mode value from various input formats.
   * Handles: string values, objects with 'value' property, or null/undefined.
   */
  const normalizeSortMode = (value: unknown): TaskSortMode => {
    // Extract candidate from value: direct string, object.value, or null
    let candidate: unknown = null;
    if (typeof value === 'string') {
      candidate = value;
    } else if (value && typeof value === 'object' && 'value' in value) {
      candidate = (value as { value?: unknown }).value;
    }
    // Validate candidate against valid sort modes
    if (typeof candidate === 'string' && validSortModes.has(candidate as TaskSortMode)) {
      return candidate as TaskSortMode;
    }
    return 'none';
  };
  const taskSortMode = computed({
    get: (): TaskSortMode => normalizeSortMode(preferencesStore.getTaskSortMode),
    set: (value: TaskSortMode) => preferencesStore.setTaskSortMode(normalizeSortMode(value)),
  });
  const taskSortDirection = computed({
    get: () => preferencesStore.getTaskSortDirection,
    set: (value: TaskSortDirection) => preferencesStore.setTaskSortDirection(value),
  });
  const sortDirectionIcon = computed(() =>
    taskSortDirection.value === 'asc' ? 'i-mdi-sort-ascending' : 'i-mdi-sort-descending'
  );
  const sortDirectionLabel = computed(() =>
    taskSortDirection.value === 'asc'
      ? t('page.tasks.sort.ascending', 'Ascending')
      : t('page.tasks.sort.descending', 'Descending')
  );
  const toggleSortDirection = () => {
    taskSortDirection.value = taskSortDirection.value === 'asc' ? 'desc' : 'asc';
  };
  const currentSortIcon = computed(() => {
    return SORT_MODE_ICONS[taskSortMode.value] ?? 'i-mdi-sort';
  });
  const traderCounts = computed(() => {
    const userView = preferencesStore.getTaskUserView;
    const secondaryView = preferencesStore.getTaskSecondaryView;
    return calculateTraderCounts(userView, secondaryView);
  });
  const mergedMaps = computed(() => {
    return maps.value.map((map) => {
      const mergedIds = (map as { mergedIds?: string[] }).mergedIds || [];
      const normalizedIds = mergedIds.includes(map.id) ? mergedIds : [map.id, ...mergedIds];
      return {
        id: map.id,
        mergedIds: normalizedIds.length ? normalizedIds : [map.id],
      };
    });
  });
  const mapTaskCounts = computed(() => {
    if (!metadataStore.tasks.length || !mergedMaps.value.length) return {};
    return calculateMapTaskTotals(
      mergedMaps.value,
      metadataStore.tasks,
      preferencesStore.getHideGlobalTasks,
      preferencesStore.getTaskUserView,
      preferencesStore.getTaskSecondaryView
    );
  });
  // Primary view (all / maps / traders)
  const primaryView = computed(() => preferencesStore.getTaskPrimaryView);
  const setPrimaryView = (view: string) => {
    preferencesStore.setTaskPrimaryView(view);
    // When switching to maps, ensure a map is selected
    if (view === 'maps' && maps.value.length > 0 && preferencesStore.getTaskMapView === 'all') {
      const firstMap = maps.value[0];
      if (firstMap?.id) {
        preferencesStore.setTaskMapView(firstMap.id);
      }
    }
    // When switching to traders, ensure a trader is selected
    if (
      view === 'traders' &&
      traders.value.length > 0 &&
      preferencesStore.getTaskTraderView === 'all'
    ) {
      const firstTrader = traders.value[0];
      if (firstTrader?.id) {
        preferencesStore.setTaskTraderView(firstTrader.id);
      }
    }
  };
  // Secondary view (available / locked / completed)
  const secondaryView = computed(() => preferencesStore.getTaskSecondaryView);
  const setSecondaryView = (view: string) => {
    preferencesStore.setTaskSecondaryView(view);
  };
  // Map selection
  const mapOptions = computed(() => {
    const counts = mapTaskCounts.value;
    return maps.value.map((map) => ({
      label: map.name,
      value: map.id,
      count: counts[map.id] ?? 0,
    }));
  });
  const onMapSelect = (selected: { label: string; value: string }) => {
    if (selected?.value) {
      preferencesStore.setTaskMapView(selected.value);
    }
  };
  // Trader selection
  const onTraderSelect = (selected: { label: string; value: string }) => {
    if (selected?.value) {
      preferencesStore.setTaskTraderView(selected.value);
    }
  };
  // User view selection (yourself / all team members)
  const onUserViewSelect = (selected: { label: string; value: string }) => {
    if (selected?.value) {
      preferencesStore.setTaskUserView(selected.value);
    }
  };
</script>
