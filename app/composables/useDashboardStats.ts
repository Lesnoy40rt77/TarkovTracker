import { computed } from "vue";
import { useProgressStore } from "@/stores/progress";
import { useMetadataStore } from "@/stores/metadata";
import { useTarkovStore } from "@/stores/tarkov";
import { CURRENCY_ITEM_IDS } from "@/utils/constants";

export function useDashboardStats() {
  const progressStore = useProgressStore();
  const metadataStore = useMetadataStore();
  const tarkovStore = useTarkovStore();

  // Available tasks count
  const availableTasksCount = computed(() => {
    if (!progressStore.unlockedTasks) return 0;
    let count = 0;
    for (const taskId in progressStore.unlockedTasks) {
      if (progressStore.unlockedTasks[taskId]?.self) count++;
    }
    return count;
  });

  // Failed tasks count
  const failedTasksCount = computed(() => {
    if (!metadataStore.tasks) return 0;
    return metadataStore.tasks.filter((t) => tarkovStore.isTaskFailed(t.id)).length;
  });

  // Needed item task objectives
  const neededItemTaskObjectives = computed(() => {
    if (!metadataStore.objectives) {
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
    return metadataStore.objectives.filter(
      (obj) => obj && obj.type && itemObjectiveTypes.includes(obj.type)
    );
  });

  // Total tasks count
  const totalTasks = computed(() => {
    if (!metadataStore.tasks) {
      return 0;
    }
    const relevantTasks = metadataStore.tasks.filter(
      (task) =>
        task &&
        (task.factionName == "Any" ||
          task.factionName == tarkovStore.getPMCFaction())
    ).length;
    return relevantTasks;
  });

  // Total objectives count
  const totalObjectives = computed(() => {
    if (!metadataStore.tasks) {
      return 0;
    }
    let total = 0;
    metadataStore.tasks
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

  // Completed objectives count
  const completedObjectives = computed(() => {
    if (!metadataStore.objectives || !tarkovStore) {
      return 0;
    }
    return metadataStore.objectives.filter(
      (objective) =>
        objective &&
        objective.id &&
        tarkovStore.isTaskObjectiveComplete(objective.id)
    ).length;
  });

  // Completed tasks count
  const completedTasks = computed(() => {
    if (!progressStore.tasksCompletions) {
      return 0;
    }
    return Object.values(progressStore.tasksCompletions).filter(
      (task) => task && task.self === true
    ).length;
  });

  // Completed task items count
  const completedTaskItems = computed(() => {
    if (
      !neededItemTaskObjectives.value ||
      !metadataStore.tasks ||
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
      const relatedTask = metadataStore.tasks.find(
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

  // Total task items count
  const totalTaskItems = computed(() => {
    if (!metadataStore.objectives || !metadataStore.tasks || !tarkovStore) {
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
      const relatedTask = metadataStore.tasks.find(
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

  // Total Kappa tasks count
  const totalKappaTasks = computed(() => {
    if (!metadataStore.tasks) {
      return 0;
    }
    return metadataStore.tasks.filter(
      (task) =>
        task &&
        task.kappaRequired === true &&
        (task.factionName == "Any" ||
          task.factionName == tarkovStore.getPMCFaction())
    ).length;
  });

  // Completed Kappa tasks count
  const completedKappaTasks = computed(() => {
    if (!metadataStore.tasks || !progressStore.tasksCompletions) {
      return 0;
    }
    return metadataStore.tasks.filter(
      (task) =>
        task &&
        task.kappaRequired === true &&
        (task.factionName == "Any" ||
          task.factionName == tarkovStore.getPMCFaction()) &&
        progressStore.tasksCompletions[task.id] &&
        progressStore.tasksCompletions[task.id]?.self === true
    ).length;
  });

  return {
    availableTasksCount,
    failedTasksCount,
    totalTasks,
    totalObjectives,
    completedObjectives,
    completedTasks,
    completedTaskItems,
    totalTaskItems,
    totalKappaTasks,
    completedKappaTasks,
  };
}