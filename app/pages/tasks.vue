<template>
  <div class="px-4 py-6">
    <UCard class="bg-contentbackground border border-white/5">
      <template #header>
        <div class="flex items-center gap-2 text-lg font-semibold">
          <UIcon name="i-mdi-clipboard-list" class="w-6 h-6" />
          <span>{{ t("page.tasks.title") }}</span>
          <span class="text-sm font-normal text-gray-400"
            >({{ visibleTasks.length.toLocaleString() }})</span
          >
        </div>
      </template>
      <div class="min-h-[400px]">
        <TaskLoadingState v-if="isLoading" />
        <div v-else>
          <!-- Task Filter Bar -->
          <TaskFilterBar />
          <div v-if="visibleTasks.length === 0" class="py-6">
            <TaskEmptyState />
          </div>
          <div v-else class="space-y-4" data-testid="task-list">
            <TaskCard
              v-for="task in visibleTasks"
              :key="task.id"
              :task="task"
              :active-user-view="activeUserView"
              :needed-by="task.neededBy ?? []"
            />
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>
<script setup lang="ts">
import { computed, watch } from "vue";
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
import { usePreferencesStore } from "@/stores/preferences";
import { useMetadataStore } from "@/stores/metadata";
import { useTaskFiltering } from "@/composables/useTaskFiltering";
import TaskCard from "@/features/tasks/TaskCard.vue";
import TaskLoadingState from "@/features/tasks/TaskLoadingState.vue";
import TaskEmptyState from "@/features/tasks/TaskEmptyState.vue";
const { t } = useI18n({ useScope: "global" });
const preferencesStore = usePreferencesStore();
const {
  getTaskPrimaryView,
  getTaskSecondaryView,
  getTaskUserView,
  getTaskMapView,
  getTaskTraderView,
} = storeToRefs(preferencesStore);
const metadataStore = useMetadataStore();
const { tasks, maps, loading: tasksLoading } = storeToRefs(metadataStore);
const { visibleTasks, reloadingTasks, updateVisibleTasks } = useTaskFiltering();
const mergedMaps = computed(() => {
  return (maps.value || []).map((map) => ({
    id: map.id,
    name: map.name,
    mergedIds: (map as unknown as { mergedIds?: string[] }).mergedIds || [
      map.id,
    ],
  }));
});
const refreshVisibleTasks = () => {
  updateVisibleTasks(
    getTaskPrimaryView.value,
    getTaskSecondaryView.value,
    getTaskUserView.value,
    getTaskMapView.value,
    getTaskTraderView.value,
    mergedMaps.value,
    tasksLoading.value
  ).catch((error) => {
    console.error("Failed to refresh tasks", error);
  });
};
watch(
  [
    getTaskPrimaryView,
    getTaskSecondaryView,
    getTaskUserView,
    getTaskMapView,
    getTaskTraderView,
    tasksLoading,
    tasks,
    maps,
  ],
  () => {
    refreshVisibleTasks();
  },
  { immediate: true }
);
const isLoading = computed(() => tasksLoading.value || reloadingTasks.value);
const activeUserView = computed(() => getTaskUserView.value);
</script>