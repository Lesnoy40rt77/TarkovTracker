<template>
  <div
    class="container mx-auto p-4 max-w-7xl min-h-[calc(100vh-250px)] flex flex-col"
  >
    <!-- Player Info Card -->
    <UCard class="mb-6">
      <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
        <!-- User Info Column -->
        <div class="md:col-span-4 space-y-2">
          <div class="text-base">
            <span class="text-gray-400"
              >{{ $t("app_bar.overflow_menu.game_edition") }}:</span
            >
            <strong class="ml-2 text-white">{{ gameEditionLabel }}</strong>
          </div>
          <div class="text-base">
            <span class="text-gray-400"
              >{{ $t("app_bar.overflow_menu.pmc_faction") }}:</span
            >
            <strong class="ml-2 text-white">{{
              tarkovStore.getPMCFaction()
            }}</strong>
          </div>
        </div>
        <!-- Quick Stats Column -->
        <div class="md:col-span-8">
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <tracker-stat
                icon="mdi-checkbox-marked-circle-outline"
                class="bg-green-900/20 border border-green-700/50"
              >
                <template #stat>{{
                  $t("page.tasks.secondaryviews.completed")
                }}</template>
                <template #value>{{ completedTasksCount }}</template>
              </tracker-stat>
            </div>
            <div>
              <tracker-stat
                icon="mdi-lock-open-variant"
                class="bg-blue-900/20 border border-blue-700/50"
              >
                <template #stat>{{
                  $t("page.tasks.secondaryviews.available")
                }}</template>
                <template #value>{{ availableTasksCount }}</template>
              </tracker-stat>
            </div>
            <div>
              <tracker-stat
                icon="mdi-alert-circle-outline"
                class="bg-red-900/20 border border-red-700/50"
              >
                <template #stat>Failed</template>
                <template #value>{{ failedTasksCount }}</template>
              </tracker-stat>
            </div>
          </div>
        </div>
      </div>
    </UCard>
    <!-- Progress Stats Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <div class="col-span-1">
        <tracker-stat icon="mdi-progress-check">
          <template #stat>{{
            $t("page.dashboard.stats.allTasks.stat")
          }}</template>
          <template #value>{{ completedTasks }}/{{ totalTasks }}</template>
          <template #percentage>
            {{
              totalTasks > 0
                ? ((completedTasks / totalTasks) * 100).toFixed(1)
                : "0.0"
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
            >{{ completedObjectives }}/{{ totalObjectives }}</template
          >
          <template #percentage>
            {{
              totalObjectives > 0
                ? ((completedObjectives / totalObjectives) * 100).toFixed(1)
                : "0.0"
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
            >{{ completedTaskItems }}/{{ totalTaskItems }}</template
          >
          <template #percentage>
            {{
              totalTaskItems > 0
                ? ((completedTaskItems / totalTaskItems) * 100).toFixed(1)
                : "0.0"
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
            >{{ completedKappaTasks }}/{{ totalKappaTasks }}</template
          >
          <template #percentage>
            {{
              totalKappaTasks > 0
                ? ((completedKappaTasks / totalKappaTasks) * 100).toFixed(1)
                : "0.0"
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
import { CURRENCY_ITEM_IDS, getEditionName } from "@/utils/constants";
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
const objectives = computed(() => metadataStore.objectives);
const progressStore = useProgressStore();
const tarkovStore = useTarkovStore();
// Player info computeds
const gameEditionLabel = computed(() => {
  const edition = tarkovStore.gameEdition;
  return getEditionName(edition);
});
// Quick stats computeds
const completedTasksCount = computed(() => {
  if (!progressStore.tasksCompletions) return 0;
  let count = 0;
  for (const taskId in progressStore.tasksCompletions) {
    if (progressStore.tasksCompletions[taskId]?.self) count++;
  }
  return count;
});
const availableTasksCount = computed(() => {
  if (!progressStore.unlockedTasks) return 0;
  let count = 0;
  for (const taskId in progressStore.unlockedTasks) {
    if (progressStore.unlockedTasks[taskId]?.self) count++;
  }
  return count;
});
const failedTasksCount = computed(() => {
  if (!tasks.value) return 0;
  return tasks.value.filter((t) => tarkovStore.isTaskFailed(t.id)).length;
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
// Needed item task objectives
const neededItemTaskObjectives = computed(() => {
  if (!objectives || !objectives.value) {
    return [];
  }
  const itemObjectiveTypes = [
    "giveItem",
    "findItem",
    "findQuestItem",
    "giveQuestItem",
    "plantQuestItem",
    "plantItem",
    "buildWeapon",
  ];
  return objectives.value.filter(
    (obj) => obj && obj.type && itemObjectiveTypes.includes(obj.type)
  );
});
// Detailed stats computeds
const totalTasks = computed(() => {
  if (!tasks.value) {
    return 0;
  }
  const relevantTasks = tasks.value.filter(
    (task) =>
      task &&
      (task.factionName == "Any" ||
        task.factionName == tarkovStore.getPMCFaction())
  ).length;
  return relevantTasks;
});
const totalObjectives = computed(() => {
  if (!tasks.value) {
    return 0;
  }
  let total = 0;
  tasks.value
    .filter(
      (task) =>
        task &&
        (task.factionName == "Any" ||
          task.factionName == tarkovStore.getPMCFaction())
    )
    .forEach((task) => {
      if (task && task.objectives) {
        total += task.objectives.length;
      }
    });
  return total;
});
const completedObjectives = computed(() => {
  if (!objectives || !objectives.value || !tarkovStore) {
    return 0;
  }
  return objectives.value.filter(
    (objective) =>
      objective &&
      objective.id &&
      tarkovStore.isTaskObjectiveComplete(objective.id)
  ).length;
});
const completedTasks = computed(() => {
  if (!progressStore.tasksCompletions) {
    return 0;
  }
  return Object.values(progressStore.tasksCompletions).filter(
    (task) => task && task.self === true
  ).length;
});
const completedTaskItems = computed(() => {
  if (
    !neededItemTaskObjectives.value ||
    !tasks.value ||
    !progressStore.tasksCompletions ||
    !progressStore.objectiveCompletions ||
    !tarkovStore
  ) {
    return 0;
  }
  let total = 0;
  neededItemTaskObjectives.value.forEach((objective) => {
    if (!objective) return;
    if (
      objective.item &&
      CURRENCY_ITEM_IDS.includes(
        objective.item.id as (typeof CURRENCY_ITEM_IDS)[number]
      )
    ) {
      return;
    }
    const relatedTask = tasks.value.find(
      (task) => task && objective.taskId && task.id === objective.taskId
    );
    const currentPMCFaction = tarkovStore.getPMCFaction();
    if (
      !relatedTask ||
      !relatedTask.factionName ||
      currentPMCFaction === undefined ||
      (relatedTask.factionName != "Any" &&
        relatedTask.factionName != currentPMCFaction)
    ) {
      return;
    }
    if (!objective.id || !objective.taskId) return;
    const taskCompletion = progressStore.tasksCompletions[objective.taskId];
    const objectiveCompletion =
      progressStore.objectiveCompletions[objective.id];
    if (
      (taskCompletion && taskCompletion["self"]) ||
      (objectiveCompletion && objectiveCompletion["self"]) ||
      (objective.count &&
        objective.id &&
        objective.count <= tarkovStore.getObjectiveCount(objective.id))
    ) {
      total += objective.count || 1;
    } else {
      if (objective.id) {
        total += tarkovStore.getObjectiveCount(objective.id);
      }
    }
  });
  return total;
});
const totalTaskItems = computed(() => {
  if (!objectives || !objectives.value || !tasks.value || !tarkovStore) {
    return 0;
  }
  let total = 0;
  neededItemTaskObjectives.value.forEach((objective) => {
    if (!objective) return;
    if (
      objective.item &&
      CURRENCY_ITEM_IDS.includes(
        objective.item.id as (typeof CURRENCY_ITEM_IDS)[number]
      )
    ) {
      return;
    }
    const relatedTask = tasks.value.find(
      (task) => task && objective.taskId && task.id === objective.taskId
    );
    const currentPMCFaction = tarkovStore.getPMCFaction();
    if (
      !relatedTask ||
      !relatedTask.factionName ||
      currentPMCFaction === undefined ||
      (relatedTask.factionName != "Any" &&
        relatedTask.factionName != currentPMCFaction)
    ) {
      return;
    }
    if (objective.count) {
      total += objective.count;
    } else {
      total += 1;
    }
  });
  return total;
});
const totalKappaTasks = computed(() => {
  if (!tasks.value) {
    return 0;
  }
  return tasks.value.filter(
    (task) =>
      task &&
      task.kappaRequired === true &&
      (task.factionName == "Any" ||
        task.factionName == tarkovStore.getPMCFaction())
  ).length;
});
const completedKappaTasks = computed(() => {
  if (!tasks.value || !progressStore.tasksCompletions) {
    return 0;
  }
  return tasks.value.filter(
    (task) =>
      task &&
      task.kappaRequired === true &&
      (task.factionName == "Any" ||
        task.factionName == tarkovStore.getPMCFaction()) &&
      progressStore.tasksCompletions[task.id] &&
      progressStore.tasksCompletions[task.id]?.self === true
  ).length;
});
</script>