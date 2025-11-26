<template>
  <div
    class="container mx-auto p-4 max-w-7xl min-h-[calc(100vh-250px)] flex flex-col"
  >
    <!-- Progress Stats Grid -->
    <div
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-6"
    >
      <div class="col-span-1">
        <tracker-stat
          icon="mdi-lock-open-variant"
          class="bg-blue-900/20 border border-blue-700/50"
        >
          <template #stat>{{
            $t("page.tasks.secondaryviews.available")
          }}</template>
          <template #value>{{
            dashboardStats.availableTasksCount
          }}</template>
          <template #details>Tasks ready to start</template>
        </tracker-stat>
      </div>
      <div class="col-span-1">
        <tracker-stat
          icon="mdi-alert-circle-outline"
          class="bg-red-900/20 border border-red-700/50"
        >
          <template #stat>Failed</template>
          <template #value>{{
            dashboardStats.failedTasksCount
          }}</template>
          <template #details>Tasks failed</template>
        </tracker-stat>
      </div>
      <div class="col-span-1">
        <tracker-stat icon="mdi-progress-check">
          <template #stat>{{
            $t("page.dashboard.stats.allTasks.stat")
          }}</template>
          <template #value
            >{{ dashboardStats.completedTasks }}/{{
              dashboardStats.totalTasks
            }}</template
          >
          <template #percentage>
            {{
              totalTasksPercentage
            }}%
          </template>
          <template #details>{{
            $t("page.dashboard.stats.allTasks.details")
          }}</template>
        </tracker-stat>
      </div>
      <div class="col-span-1">
        <tracker-stat icon="mdi-briefcase-search">
          <template #stat>{{
            $t("page.dashboard.stats.allObjectives.stat")
          }}</template>
          <template #value
            >{{ dashboardStats.completedObjectives }}/{{
              dashboardStats.totalObjectives
            }}</template
          >
          <template #percentage>
            {{
              totalObjectivesPercentage
            }}%
          </template>
          <template #details>{{
            $t("page.dashboard.stats.allObjectives.details")
          }}</template>
        </tracker-stat>
      </div>
      <div class="col-span-1">
        <tracker-stat icon="mdi-briefcase-search">
          <template #stat>{{
            $t("page.dashboard.stats.taskItems.stat")
          }}</template>
          <template #value
            >{{ dashboardStats.completedTaskItems }}/{{
              dashboardStats.totalTaskItems
            }}</template
          >
          <template #percentage>
            {{
              totalTaskItemsPercentage
            }}%
          </template>
          <template #details>{{
            $t("page.dashboard.stats.taskItems.details")
          }}</template>
        </tracker-stat>
      </div>
      <div class="col-span-1">
        <tracker-stat icon="mdi-trophy">
          <template #stat>{{
            $t("page.dashboard.stats.kappaTasks.stat")
          }}</template>
          <template #value
            >{{ dashboardStats.completedKappaTasks }}/{{
              dashboardStats.totalKappaTasks
            }}</template
          >
          <template #percentage>
            {{
              totalKappaTasksPercentage
            }}%
          </template>
          <template #details>{{
            $t("page.dashboard.stats.kappaTasks.details")
          }}</template>
        </tracker-stat>
      </div>
    </div>
    <!-- Active Tasks Section -->
    <div class="grid grid-cols-1 gap-6 mt-6">
      <div class="col-span-1">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-xl font-bold text-white">
            {{ $t("page.tasks.primaryviews.all") }}
          </h2>
          <!-- Task Status Filter Tabs -->
          <div class="flex gap-2">
            <UButton
              :color="taskFilter === 'available' ? 'primary' : 'neutral'"
              :variant="taskFilter === 'available' ? 'solid' : 'ghost'"
              size="sm"
              @click="taskFilter = 'available'"
            >
              {{ $t("page.tasks.secondaryviews.available") }}
            </UButton>
            <UButton
              :color="taskFilter === 'locked' ? 'primary' : 'neutral'"
              :variant="taskFilter === 'locked' ? 'solid' : 'ghost'"
              size="sm"
              @click="taskFilter = 'locked'"
            >
              Locked
            </UButton>
            <UButton
              :color="taskFilter === 'completed' ? 'primary' : 'neutral'"
              :variant="taskFilter === 'completed' ? 'solid' : 'ghost'"
              size="sm"
              @click="taskFilter = 'completed'"
            >
              {{ $t("page.tasks.secondaryviews.completed") }}
            </UButton>
          </div>
        </div>
        <div v-if="loading" class="flex justify-center p-4">
          <UIcon
            name="i-mdi-loading"
            class="w-8 h-8 animate-spin text-cyan-500"
          />
        </div>
        <div v-else-if="filteredTasks.length === 0" class="text-center p-4">
          <UAlert
            icon="i-mdi-information"
            color="info"
            variant="soft"
            :title="$t('page.tasks.notasksfound')"
          />
        </div>
        <div v-else class="space-y-2">
          <task-card
            v-for="task in filteredTasks"
            :key="task.id"
            :task="task"
            active-user-view="self"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, defineAsyncComponent } from "vue";
import { storeToRefs } from "pinia";
import { useMetadataStore } from "@/stores/metadata";
import { useProgressStore } from "@/stores/progress";
import { useTarkovStore } from "@/stores/tarkov";
import { useDashboardStats } from "@/composables/useDashboardStats";
import type { Task } from "@/types/tarkov";

// Lazy load components
const TrackerStat = defineAsyncComponent(
  () => import("@/features/dashboard/TrackerStat.vue")
);
const TaskCard = defineAsyncComponent(
  () => import("@/features/tasks/TaskCard.vue")
);

// Composables and stores
const metadataStore = useMetadataStore();
const { tasks, loading } = storeToRefs(metadataStore);
const progressStore = useProgressStore();
const tarkovStore = useTarkovStore();

// Dashboard statistics composable
const dashboardStats = useDashboardStats();

// Percentage calculations
const totalTasksPercentage = computed(() => {
  return dashboardStats.totalTasks.value > 0
    ? ((dashboardStats.completedTasks.value / dashboardStats.totalTasks.value) * 100).toFixed(1)
    : "0.0";
});

const totalObjectivesPercentage = computed(() => {
  return dashboardStats.totalObjectives.value > 0
    ? (
        (dashboardStats.completedObjectives.value / dashboardStats.totalObjectives.value) *
        100
      ).toFixed(1)
    : "0.0";
});

const totalTaskItemsPercentage = computed(() => {
  return dashboardStats.totalTaskItems.value > 0
    ? (
        (dashboardStats.completedTaskItems.value / dashboardStats.totalTaskItems.value) *
        100
      ).toFixed(1)
    : "0.0";
});

const totalKappaTasksPercentage = computed(() => {
  return dashboardStats.totalKappaTasks.value > 0
    ? (
        (dashboardStats.completedKappaTasks.value / dashboardStats.totalKappaTasks.value) *
        100
      ).toFixed(1)
    : "0.0";
});

// Task filter state
const taskFilter = ref<"available" | "locked" | "completed">("available");

// Filtered tasks based on selected filter
const filteredTasks = computed<Task[]>(() => {
  if (!tasks.value) return [];
  switch (taskFilter.value) {
    case "available":
      return tasks.value.filter((task) => {
        const isUnlocked = progressStore.unlockedTasks?.[task.id]?.self;
        const isComplete = tarkovStore.isTaskComplete(task.id);
        return isUnlocked && !isComplete;
      });
    case "locked":
      return tasks.value.filter((task) => {
        const isUnlocked = progressStore.unlockedTasks?.[task.id]?.self;
        return !isUnlocked;
      });
    case "completed":
      return tasks.value.filter((task) => {
        return tarkovStore.isTaskComplete(task.id);
      });
    default:
      return [];
  }
});
</script>