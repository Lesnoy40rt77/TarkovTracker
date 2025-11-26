<template>
  <UCard
    :id="`task-${task.id}`"
    class="relative overflow-hidden border border-white/10 bg-[#141414]"
    :class="taskClasses"
    :ui="{ body: 'p-4' }"
  >
    <div
      v-if="showBackgroundIcon"
      class="absolute inset-0 z-0 flex items-center justify-start p-8 opacity-15 pointer-events-none text-[#c6afaf] transform rotate-12"
    >
      <UIcon
        :name="
          backgroundIcon.startsWith('mdi-')
            ? `i-${backgroundIcon}`
            : backgroundIcon
        "
        class="w-24 h-24"
      />
    </div>
    <div class="grid gap-4 lg:grid-cols-12 relative z-10">
      <!-- Quest Info Section -->
      <div class="lg:col-span-3" :class="xs ? 'text-center' : 'text-left'">
        <TaskInfo
          :task="task"
          :xs="xs"
          :locked-before="lockedBefore"
          :locked-behind="lockedBehind"
          :faction-image="factionImage"
          :non-kappa="nonKappa"
          :needed-by="neededBy"
          :active-user-view="activeUserView"
        />
      </div>
      <!-- Quest Content Section -->
      <div class="lg:col-span-7 flex items-center">
        <div class="w-full space-y-3">
          <QuestKeys
            v-if="task?.neededKeys?.length"
            :needed-keys="task.neededKeys"
          />
          <QuestObjectives
            :objectives="relevantViewObjectives"
            :irrelevant-count="irrelevantObjectives.length"
            :uncompleted-irrelevant="uncompletedIrrelevantObjectives.length"
          />
        </div>
      </div>
      <!-- Actions Section -->
      <div class="lg:col-span-2 flex items-center justify-center">
        <TaskActions
          :task="task"
          :tasks="tasks"
          :xs="xs"
          :is-complete="isComplete"
          :is-locked="isLocked"
          :is-our-faction="isOurFaction"
          @complete="markTaskComplete"
          @uncomplete="markTaskUncomplete"
          @unlock="markTaskAvailable"
        />
      </div>
    </div>
  </UCard>
  <Teleport to="body">
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 translate-y-3"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-3"
    >
      <div
        v-if="taskStatusUpdated"
        class="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
      >
        <UCard
          class="w-full max-w-xl bg-gray-900/95 border border-white/10 shadow-2xl"
        >
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
            <span class="text-sm sm:text-base">{{ taskStatus }}</span>
            <div class="flex gap-2 justify-end flex-1">
              <UButton
                v-if="showUndoButton"
                size="xs"
                variant="soft"
                color="primary"
                @click="undoLastAction"
              >
                {{ t("page.tasks.questcard.undo") }}
              </UButton>
              <UButton
                size="xs"
                variant="ghost"
                color="gray"
                @click="taskStatusUpdated = false"
              >
                {{ t("page.tasks.filters.close") }}
              </UButton>
            </div>
          </div>
        </UCard>
      </div>
    </Transition>
  </Teleport>
</template>
<script setup>
import { defineAsyncComponent, computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useBreakpoints } from "@vueuse/core";
import { useTarkovStore } from "@/stores/tarkov";
import { useProgressStore } from "@/stores/progress";
import { usePreferencesStore } from "@/stores/preferences";
import { useMetadataStore } from "@/stores/metadata";
const TaskInfo = defineAsyncComponent(() => import("./TaskInfo.vue"));
const QuestKeys = defineAsyncComponent(() => import("./QuestKeys.vue"));
const QuestObjectives = defineAsyncComponent(() =>
  import("./QuestObjectives.vue")
);
const TaskActions = defineAsyncComponent(() => import("./TaskActions.vue"));
const props = defineProps({
  task: { type: Object, required: true },
  activeUserView: { type: String, required: true },
  neededBy: { type: Array, default: () => [] },
});
const { t } = useI18n({ useScope: "global" });
// Define breakpoints (matching Vuetify's xs/sm breakpoint at 600px)
const breakpoints = useBreakpoints({
  mobile: 0,
  sm: 600,
});
const xs = breakpoints.smaller("sm");
const tarkovStore = useTarkovStore();
const progressStore = useProgressStore();
const preferencesStore = usePreferencesStore();
const metadataStore = useMetadataStore();
const tasks = computed(() => metadataStore.tasks);
const taskStatusUpdated = ref(false);
const taskStatus = ref("");
// { taskId: string, taskName: string, action: 'complete' | 'uncomplete' }
const undoData = ref(null);
const showUndoButton = ref(false);
// Computed properties
const isComplete = computed(() => tarkovStore.isTaskComplete(props.task.id));
const isFailed = computed(() => tarkovStore.isTaskFailed(props.task.id));
const isLocked = computed(
  () =>
    progressStore.unlockedTasks[props.task.id]?.self !== true &&
    !isComplete.value
);
const isOurFaction = computed(() => {
  const taskFaction = props.task.factionName;
  return taskFaction === "Any" || taskFaction === tarkovStore.getPMCFaction();
});
const taskClasses = computed(() => {
  if (isComplete.value && !isFailed.value) {
    return "bg-gradient-to-b from-green-900/90 to-transparent";
  }
  if (isLocked.value || isFailed.value) {
    return "bg-gradient-to-b from-red-900/90 to-transparent";
  }
  return "";
});
const showBackgroundIcon = computed(
  () => isLocked.value || isFailed.value || isComplete.value
);
const backgroundIcon = computed(() => {
  if (isComplete.value) return "mdi-check";
  if (isLocked.value || isFailed.value) return "mdi-lock";
  return "";
});
const lockedBehind = computed(
  () =>
    props.task.successors?.filter((s) => !tarkovStore.isTaskComplete(s.id))
      .length || 0
);
const lockedBefore = computed(
  () =>
    props.task.predecessors?.filter((s) => !tarkovStore.isTaskComplete(s.id))
      .length || 0
);
const nonKappa = computed(() => !props.task.kappaRequired);
const factionImage = computed(
  () => `/img/factions/${props.task.factionName}.webp`
);
const mapObjectiveTypes = [
  "mark",
  "zone",
  "extract",
  "visit",
  "findItem",
  "findQuestItem",
  "plantItem",
  "plantQuestItem",
  "shoot",
];
const onMapView = computed(() => preferencesStore.getTaskPrimaryView === "maps");
const relevantViewObjectives = computed(() => {
  if (!onMapView.value) return props.task.objectives;
  return props.task.objectives.filter((o) => {
    if (!Array.isArray(o.maps) || !o.maps.length) return true;
    return (
      o.maps.some((m) => m.id === preferencesStore.getTaskMapView) &&
      mapObjectiveTypes.includes(o.type)
    );
  });
});
const irrelevantObjectives = computed(() => {
  if (!onMapView.value) return [];
  return props.task.objectives.filter((o) => {
    if (!Array.isArray(o.maps) || !o.maps.length) return false;
    const onSelectedMap = o.maps.some((m) => m.id === preferencesStore.getTaskMapView);
    const isMapType = mapObjectiveTypes.includes(o.type);
    return !(onSelectedMap && isMapType);
  });
});
const uncompletedIrrelevantObjectives = computed(() =>
  props.task.objectives
    .filter((o) => {
      const onCorrectMap = o?.maps?.some(
        (m) => m.id === preferencesStore.getTaskMapView
      );
      const isMapObjectiveType = mapObjectiveTypes.includes(o.type);
      return !onCorrectMap || !isMapObjectiveType;
    })
    .filter((o) => !tarkovStore.isTaskObjectiveComplete(o.id))
);
// Methods
const updateTaskStatus = (
  statusKey,
  taskName = props.task.name,
  showUndo = false
) => {
  taskStatus.value = t(statusKey, { name: taskName });
  taskStatusUpdated.value = true;
  showUndoButton.value = showUndo;
};
const undoLastAction = () => {
  if (!undoData.value) return;
  const { taskId, taskName, action } = undoData.value;
  if (action === "complete") {
    // Undo completion by setting task as uncompleted
    tarkovStore.setTaskUncompleted(taskId);
    // Find the task to handle objectives and alternatives
    const taskToUndo = tasks.value.find((task) => task.id === taskId);
    if (taskToUndo) {
      handleTaskObjectives(taskToUndo.objectives, "setTaskObjectiveUncomplete");
      handleAlternatives(
        taskToUndo.alternatives,
        "setTaskUncompleted",
        "setTaskObjectiveUncomplete"
      );
    }
    updateTaskStatus("page.tasks.questcard.undocomplete", taskName);
  } else if (action === "uncomplete") {
    // Undo uncompleting by setting task as completed
    tarkovStore.setTaskComplete(taskId);
    // Find the task to handle objectives and alternatives
    const taskToUndo = tasks.value.find((task) => task.id === taskId);
    if (taskToUndo) {
      handleTaskObjectives(taskToUndo.objectives, "setTaskObjectiveComplete");
      handleAlternatives(
        taskToUndo.alternatives,
        "setTaskFailed",
        "setTaskObjectiveComplete"
      );
      // Ensure min level for completion
      if (tarkovStore.playerLevel() < taskToUndo.minPlayerLevel) {
        tarkovStore.setLevel(taskToUndo.minPlayerLevel);
      }
    }
    updateTaskStatus("page.tasks.questcard.undouncomplete", taskName);
  }
  showUndoButton.value = false;
  undoData.value = null;
};
const handleTaskObjectives = (objectives, action) => {
  objectives.forEach((o) => tarkovStore[action](o.id));
};
const handleAlternatives = (alternatives, taskAction, objectiveAction) => {
  if (!Array.isArray(alternatives)) return;
  alternatives.forEach((a) => {
    tarkovStore[taskAction](a);
    const alternativeTask = tasks.value.find((task) => task.id === a);
    if (alternativeTask?.objectives) {
      handleTaskObjectives(alternativeTask.objectives, objectiveAction);
    }
  });
};
const ensureMinLevel = () => {
  if (tarkovStore.playerLevel() < props.task.minPlayerLevel) {
    tarkovStore.setLevel(props.task.minPlayerLevel);
  }
};
const markTaskComplete = (isUndo = false) => {
  if (!isUndo) {
    // Store undo data before performing the action
    undoData.value = {
      taskId: props.task.id,
      taskName: props.task.name,
      action: "complete",
    };
  }
  tarkovStore.setTaskComplete(props.task.id);
  handleTaskObjectives(props.task.objectives, "setTaskObjectiveComplete");
  handleAlternatives(
    props.task.alternatives,
    "setTaskFailed",
    "setTaskObjectiveComplete"
  );
  ensureMinLevel();
  if (isUndo) {
    updateTaskStatus("page.tasks.questcard.undocomplete");
  } else {
    updateTaskStatus(
      "page.tasks.questcard.statuscomplete",
      props.task.name,
      true
    );
  }
};
const markTaskUncomplete = (isUndo = false) => {
  if (!isUndo) {
    // Store undo data before performing the action
    undoData.value = {
      taskId: props.task.id,
      taskName: props.task.name,
      action: "uncomplete",
    };
  }
  tarkovStore.setTaskUncompleted(props.task.id);
  handleTaskObjectives(props.task.objectives, "setTaskObjectiveUncomplete");
  handleAlternatives(
    props.task.alternatives,
    "setTaskUncompleted",
    "setTaskObjectiveUncomplete"
  );
  if (isUndo) {
    updateTaskStatus("page.tasks.questcard.undouncomplete");
  } else {
    updateTaskStatus(
      "page.tasks.questcard.statusuncomplete",
      props.task.name,
      true
    );
  }
};
const markTaskAvailable = () => {
  props.task.predecessors?.forEach((p) => {
    tarkovStore.setTaskComplete(p);
    const predecessorTask = tasks.value.find((task) => task.id === p);
    if (predecessorTask?.objectives) {
      handleTaskObjectives(
        predecessorTask.objectives,
        "setTaskObjectiveComplete"
      );
    }
  });
  ensureMinLevel();
  updateTaskStatus("page.tasks.questcard.statusavailable");
};
</script>