<template>
  <v-container>
    <!-- Welcome / Stats Section -->
    <v-row>
      <v-col cols="12">
        <v-card class="mb-4">
          <v-card-title class="text-h5">
            {{ $t("page.dashboard.title") }}
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="4">
                <div class="text-subtitle-1">
                  {{ $t("navigation_drawer.level") }}:
                  <strong>{{ tarkovStore.playerLevel }}</strong>
                </div>
                <div class="text-subtitle-1">
                  {{ $t("app_bar.overflow_menu.game_edition") }}:
                  <strong>{{ gameEditionLabel }}</strong>
                </div>
                <div class="text-subtitle-1">
                  {{ $t("app_bar.overflow_menu.pmc_faction") }}:
                  <strong>{{ tarkovStore.getPMCFaction() }}</strong>
                </div>
              </v-col>
              <v-col cols="12" md="8">
                <v-row>
                  <v-col cols="6" sm="3">
                    <tracker-stat
                      icon="mdi-checkbox-marked-circle-outline"
                      color="success"
                      :value="completedTasksCount"
                      :label="$t('page.tasks.secondaryviews.completed')"
                    />
                  </v-col>
                  <v-col cols="6" sm="3">
                    <tracker-stat
                      icon="mdi-lock-open-variant"
                      color="primary"
                      :value="availableTasksCount"
                      :label="$t('page.tasks.secondaryviews.available')"
                    />
                  </v-col>
                  <v-col cols="6" sm="3">
                    <tracker-stat
                      icon="mdi-alert-circle-outline"
                      color="error"
                      :value="failedTasksCount"
                      label="Failed"
                    />
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Recent/Active Tasks Section -->
    <v-row>
      <v-col cols="12">
        <h2 class="text-h5 mb-3">{{ $t("page.tasks.primaryviews.all") }}</h2>
        <div v-if="loading" class="d-flex justify-center pa-4">
          <v-progress-circular
            indeterminate
            color="primary"
          ></v-progress-circular>
        </div>
        <div v-else-if="activeTasks.length === 0" class="text-center pa-4">
          <v-alert type="info" variant="tonal">
            {{ $t("page.tasks.notasksfound") }}
          </v-alert>
        </div>
        <div v-else>
          <task-card
            v-for="task in activeTasks"
            :key="task.id"
            :task="task"
            active-user-view="self"
            class="mb-2"
          />
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from "vue";
import { useTarkovStore } from "@/stores/tarkov";
import { useProgressStore } from "@/stores/progress";
import { useTarkovData } from "@/composables/tarkovdata";

// Components
const TrackerStat = defineAsyncComponent(() => import("./TrackerStat.vue"));
const TaskCard = defineAsyncComponent(
  () => import("@/features/tasks/TaskCard.vue")
);

const tarkovStore = useTarkovStore();
const progressStore = useProgressStore();
const { tasks, loading } = useTarkovData();

// Computed Stats
const gameEditionLabel = computed(() => {
  const edition = tarkovStore.gameEdition;
  // Map edition number to label if needed, or just display
  return edition === 5 ? "Edge of Darkness" : "Standard"; // Simplified mapping
});

const completedTasksCount = computed(() => {
  if (!progressStore.tasksCompletions) return 0;
  // Count tasks marked as complete for 'self'
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
  // Assuming failed status is stored similarly or derived
  // For now, returning 0 or implementing if store supports it
  // The progress store structure for failed tasks might be in tasksCompletions or separate
  // Based on TaskCard logic: tarkovStore.isTaskFailed(id)
  // We can iterate tasks and check
  if (!tasks.value) return 0;
  return tasks.value.filter((t) => tarkovStore.isTaskFailed(t.id)).length;
});

// Active Tasks (Limit to first 5 available for dashboard)
const activeTasks = computed(() => {
  if (!tasks.value || !progressStore.unlockedTasks) return [];

  return tasks.value
    .filter((task) => {
      // Show tasks that are unlocked for self and NOT complete
      const isUnlocked = progressStore.unlockedTasks[task.id]?.self;
      const isComplete = tarkovStore.isTaskComplete(task.id);
      return isUnlocked && !isComplete;
    })
    .slice(0, 5); // Show top 5
});
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}
</style>
