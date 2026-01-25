<template>
  <aside
    class="bg-surface-800/95 fixed top-1/2 right-4 z-40 h-fit max-h-[calc(100vh-6rem)] w-72 -translate-y-1/2 overflow-y-auto rounded-lg border border-white/10 p-4 shadow-xl backdrop-blur-sm"
  >
    <div class="mb-3 flex items-center justify-between">
      <h2 class="text-sm font-semibold text-white">
        {{ t('page.tasks.settings.title', 'Task Settings') }}
      </h2>
      <UButton
        variant="ghost"
        color="neutral"
        icon="i-mdi-close"
        size="xs"
        :aria-label="t('common.close', 'Close')"
        @click="close"
      />
    </div>
    <div class="space-y-3">
      <section class="bg-surface-800/50 rounded-lg border border-white/5 p-3">
        <div class="mb-2 flex items-center gap-2">
          <UIcon name="i-mdi-filter-variant" class="text-primary-400 h-4 w-4" />
          <h3 class="text-xs font-semibold tracking-wide text-white uppercase">
            {{ t('page.tasks.settings.tabs.filters', 'Task Filters') }}
          </h3>
        </div>
        <p class="text-surface-500 mb-2 text-xs">
          {{ t('page.tasks.settings.filters.hint', 'Control which tasks appear.') }}
        </p>
        <div class="space-y-1">
          <label
            class="hover:bg-surface-700/50 flex cursor-pointer items-center gap-2.5 rounded px-2 py-1.5 transition-colors"
          >
            <UCheckbox v-model="showNonSpecialTasks" />
            <div class="min-w-0 flex-1">
              <span class="text-surface-200 text-sm">Regular Tasks</span>
            </div>
          </label>
          <label
            class="hover:bg-surface-700/50 flex cursor-pointer items-center gap-2.5 rounded px-2 py-1.5 transition-colors"
          >
            <UCheckbox v-model="showKappaTasks" />
            <div class="flex min-w-0 flex-1 items-center gap-2">
              <span class="text-surface-200 text-sm">Kappa Required</span>
              <UBadge color="kappa" variant="soft" size="xs">KAPPA</UBadge>
            </div>
          </label>
          <label
            class="hover:bg-surface-700/50 flex cursor-pointer items-center gap-2.5 rounded px-2 py-1.5 transition-colors"
          >
            <UCheckbox v-model="showLightkeeperTasks" />
            <div class="flex min-w-0 flex-1 items-center gap-2">
              <span class="text-surface-200 text-sm">Lightkeeper Required</span>
              <UBadge color="lightkeeper" variant="soft" size="xs">LIGHTKEEPER</UBadge>
            </div>
          </label>
          <label
            v-if="hasTeammates"
            class="hover:bg-surface-700/50 flex cursor-pointer items-center gap-2.5 rounded px-2 py-1.5 transition-colors"
          >
            <UCheckbox v-model="sharedByAllOnly" />
            <div class="min-w-0 flex-1">
              <span class="text-surface-200 text-sm">Team Shared Only</span>
            </div>
          </label>
        </div>
      </section>
      <section class="bg-surface-800/50 rounded-lg border border-white/5 p-3">
        <div class="mb-2 flex items-center gap-2">
          <UIcon name="i-mdi-card-text" class="text-info-400 h-4 w-4" />
          <h3 class="text-xs font-semibold tracking-wide text-white uppercase">
            {{ t('page.tasks.settings.tabs.appearance', 'Card Display') }}
          </h3>
        </div>
        <p class="text-surface-500 mb-2 text-xs">
          {{ t('page.tasks.settings.appearance.hint', 'Choose what to show on cards.') }}
        </p>
        <div class="space-y-1">
          <label
            class="hover:bg-surface-700/50 flex cursor-pointer items-center gap-2.5 rounded px-2 py-1.5 transition-colors"
          >
            <UCheckbox v-model="showRequiredLabels" />
            <span class="text-surface-200 text-sm">"Required" Labels</span>
          </label>
          <label
            class="hover:bg-surface-700/50 flex cursor-pointer items-center gap-2.5 rounded px-2 py-1.5 transition-colors"
          >
            <UCheckbox v-model="showExperienceRewards" />
            <span class="text-surface-200 text-sm">Experience Rewards</span>
          </label>
          <label
            class="hover:bg-surface-700/50 flex cursor-pointer items-center gap-2.5 rounded px-2 py-1.5 transition-colors"
          >
            <UCheckbox v-model="showNextQuests" />
            <span class="text-surface-200 text-sm">Next Tasks</span>
          </label>
          <label
            class="hover:bg-surface-700/50 flex cursor-pointer items-center gap-2.5 rounded px-2 py-1.5 transition-colors"
          >
            <UCheckbox v-model="showPreviousQuests" />
            <span class="text-surface-200 text-sm">Previous Tasks</span>
          </label>
          <label
            class="hover:bg-surface-700/50 flex cursor-pointer items-center gap-2.5 rounded px-2 py-1.5 transition-colors"
          >
            <UCheckbox v-model="hideCompletedTaskObjectives" />
            <span class="text-surface-200 text-sm">Hide Completed Task Objectives</span>
          </label>
        </div>
      </section>
      <section class="bg-surface-800/50 rounded-lg border border-white/5 p-3">
        <div class="mb-2 flex items-center gap-2">
          <UIcon name="i-mdi-filter-variant" class="text-success-400 h-4 w-4" />
          <h3 class="text-xs font-semibold tracking-wide text-white uppercase">
            {{ t('page.tasks.settings.tabs.filterBar', 'Filter Bar') }}
          </h3>
        </div>
        <p class="text-surface-500 mb-2 text-xs">
          {{ t('page.tasks.settings.filterBar.hint', 'Show or hide status filters.') }}
        </p>
        <div class="space-y-1">
          <label
            class="hover:bg-surface-700/50 flex cursor-pointer items-center gap-2.5 rounded px-2 py-1.5 transition-colors"
          >
            <UCheckbox v-model="showAllFilter" />
            <span class="text-surface-200 text-sm">All Filter</span>
          </label>
          <label
            class="hover:bg-surface-700/50 flex cursor-pointer items-center gap-2.5 rounded px-2 py-1.5 transition-colors"
          >
            <UCheckbox v-model="showAvailableFilter" />
            <span class="text-surface-200 text-sm">Available Filter</span>
          </label>
          <label
            class="hover:bg-surface-700/50 flex cursor-pointer items-center gap-2.5 rounded px-2 py-1.5 transition-colors"
          >
            <UCheckbox v-model="showLockedFilter" />
            <span class="text-surface-200 text-sm">Locked Filter</span>
          </label>
          <label
            class="hover:bg-surface-700/50 flex cursor-pointer items-center gap-2.5 rounded px-2 py-1.5 transition-colors"
          >
            <UCheckbox v-model="showCompletedFilter" />
            <span class="text-surface-200 text-sm">Completed Filter</span>
          </label>
          <label
            class="hover:bg-surface-700/50 flex cursor-pointer items-center gap-2.5 rounded px-2 py-1.5 transition-colors"
          >
            <UCheckbox v-model="showFailedFilter" />
            <span class="text-surface-200 text-sm">Failed Filter</span>
          </label>
        </div>
      </section>
      <section class="bg-surface-800/50 rounded-lg border border-white/5 p-3">
        <div class="mb-2 flex items-center gap-2">
          <UIcon name="i-mdi-cog" class="text-warning-400 h-4 w-4" />
          <h3 class="text-xs font-semibold tracking-wide text-white uppercase">
            {{ t('page.tasks.settings.tabs.advanced', 'Advanced') }}
          </h3>
        </div>
        <div class="space-y-1">
          <label
            class="hover:bg-surface-700/50 flex cursor-pointer items-center gap-2.5 rounded px-2 py-1.5 transition-colors"
          >
            <UCheckbox v-model="enableManualTaskFail" />
            <span class="text-surface-200 text-sm">Manual Fail Actions</span>
          </label>
          <div v-if="failedTasksCount > 0" class="bg-surface-900/50 mt-2 rounded p-2">
            <div class="mb-1.5 flex items-center justify-between">
              <span class="text-surface-400 text-xs">Failed tasks</span>
              <UBadge color="warning" variant="soft" size="xs">
                {{ failedTasksCount }}
              </UBadge>
            </div>
            <UButton color="warning" variant="soft" size="xs" block @click="repairFailedTasks">
              <UIcon name="i-mdi-wrench" class="mr-1 h-3.5 w-3.5" />
              Repair
            </UButton>
          </div>
        </div>
      </section>
    </div>
  </aside>
</template>
<script setup lang="ts">
  import { computed } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useTaskSettingsDrawer } from '@/composables/useTaskSettingsDrawer';
  import { useMetadataStore } from '@/stores/useMetadata';
  import { usePreferencesStore } from '@/stores/usePreferences';
  import { useTarkovStore } from '@/stores/useTarkov';
  import { useTeamStore } from '@/stores/useTeamStore';
  import { MANUAL_FAIL_TASK_IDS } from '@/utils/constants';
  const { t } = useI18n({ useScope: 'global' });
  const { close } = useTaskSettingsDrawer();
  const preferencesStore = usePreferencesStore();
  const metadataStore = useMetadataStore();
  const tarkovStore = useTarkovStore();
  const teamStore = useTeamStore();
  const hasTeammates = computed(() => (teamStore.teammates?.length ?? 0) > 0);
  const showKappaTasks = computed({
    get: () => !preferencesStore.getHideNonKappaTasks,
    set: (value) => preferencesStore.setHideNonKappaTasks(!value),
  });
  const showNonSpecialTasks = computed({
    get: () => preferencesStore.getShowNonSpecialTasks,
    set: (value) => preferencesStore.setShowNonSpecialTasks(value),
  });
  const showLightkeeperTasks = computed({
    get: () => preferencesStore.getShowLightkeeperTasks,
    set: (value) => preferencesStore.setShowLightkeeperTasks(value),
  });
  const sharedByAllOnly = computed({
    get: () => preferencesStore.getTaskSharedByAllOnly,
    set: (value) => preferencesStore.setTaskSharedByAllOnly(value),
  });
  const showRequiredLabels = computed({
    get: () => preferencesStore.getShowRequiredLabels,
    set: (value) => preferencesStore.setShowRequiredLabels(value),
  });
  const showExperienceRewards = computed({
    get: () => preferencesStore.getShowExperienceRewards,
    set: (value) => preferencesStore.setShowExperienceRewards(value),
  });
  const showNextQuests = computed({
    get: () => preferencesStore.getShowNextQuests,
    set: (value) => preferencesStore.setShowNextQuests(value),
  });
  const showPreviousQuests = computed({
    get: () => preferencesStore.getShowPreviousQuests,
    set: (value) => preferencesStore.setShowPreviousQuests(value),
  });
  const enableManualTaskFail = computed({
    get: () => preferencesStore.getEnableManualTaskFail,
    set: (value) => preferencesStore.setEnableManualTaskFail(value),
  });
  const hideCompletedTaskObjectives = computed({
    get: () => preferencesStore.getHideCompletedTaskObjectives,
    set: (value) => preferencesStore.setHideCompletedTaskObjectives(value),
  });
  const showAllFilter = computed({
    get: () => preferencesStore.getShowAllFilter,
    set: (value) => preferencesStore.setShowAllFilter(value),
  });
  const showAvailableFilter = computed({
    get: () => preferencesStore.getShowAvailableFilter,
    set: (value) => preferencesStore.setShowAvailableFilter(value),
  });
  const showLockedFilter = computed({
    get: () => preferencesStore.getShowLockedFilter,
    set: (value) => preferencesStore.setShowLockedFilter(value),
  });
  const showCompletedFilter = computed({
    get: () => preferencesStore.getShowCompletedFilter,
    set: (value) => preferencesStore.setShowCompletedFilter(value),
  });
  const showFailedFilter = computed({
    get: () => preferencesStore.getShowFailedFilter,
    set: (value) => preferencesStore.setShowFailedFilter(value),
  });
  const failedTasksCount = computed(
    () => metadataStore.tasks.filter((task) => tarkovStore.isTaskFailed(task.id)).length
  );
  const isTaskSuccessful = (taskId: string) =>
    tarkovStore.isTaskComplete(taskId) && !tarkovStore.isTaskFailed(taskId);
  const hasStatus = (status: string[] | undefined, statuses: string[]) => {
    const normalized = (status ?? []).map((entry) => entry.toLowerCase());
    return statuses.some((value) => normalized.includes(value));
  };
  const buildAlternativeSources = () => {
    const sourcesByTask = new Map<string, string[]>();
    metadataStore.tasks.forEach((task) => {
      (task.alternatives ?? []).forEach((alternativeId) => {
        const sources = sourcesByTask.get(alternativeId) ?? [];
        if (!sources.includes(task.id)) {
          sources.push(task.id);
          sourcesByTask.set(alternativeId, sources);
        }
      });
    });
    return sourcesByTask;
  };
  const shouldTaskBeFailed = (
    task: {
      id: string;
      failConditions?: Array<{ task?: { id?: string }; status?: string[] }>;
    },
    alternativeSources: Map<string, string[]>
  ) => {
    if (MANUAL_FAIL_TASK_IDS.includes(task.id)) return true;
    const failConditions = task.failConditions ?? [];
    const failedByCondition = failConditions.some((objective) => {
      if (!objective?.task?.id) return false;
      if (!hasStatus(objective.status, ['complete', 'completed'])) return false;
      return isTaskSuccessful(objective.task.id);
    });
    if (failedByCondition) return true;
    const sources = alternativeSources.get(task.id);
    if (!sources?.length) return false;
    return sources.some((sourceId) => isTaskSuccessful(sourceId));
  };
  const repairFailedTasks = () => {
    if (failedTasksCount.value === 0) return;
    const confirmed = window.confirm(
      t(
        'page.tasks.settings.advanced.repairFailedConfirm',
        'Repair failed tasks by clearing failed flags that are not supported by current fail conditions?'
      )
    );
    if (!confirmed) return;
    const alternativeSources = buildAlternativeSources();
    let repaired = 0;
    metadataStore.tasks.forEach((task) => {
      if (!tarkovStore.isTaskFailed(task.id)) return;
      if (shouldTaskBeFailed(task, alternativeSources)) return;
      tarkovStore.setTaskUncompleted(task.id);
      task.objectives?.forEach((objective) => {
        if (objective?.id) {
          tarkovStore.setTaskObjectiveUncomplete(objective.id);
        }
      });
      repaired += 1;
    });
    window.alert(
      t(
        'page.tasks.settings.advanced.repairFailedDone',
        { count: repaired },
        'Cleared failed status for {count} tasks.'
      )
    );
  };
</script>
