import { useMetadataStore } from '@/stores/useMetadata';
import { useTarkovStore } from '@/stores/useTarkov';
import type { NeededItemHideoutModule, NeededItemTaskObjective } from '@/types/tarkov';
export interface ObjectiveUpdate {
  id: string;
  type: 'task' | 'hideout';
  count: number;
  needed: number;
}
export interface DistributionResult {
  updates: ObjectiveUpdate[];
  remainingFir: number;
  remainingNonFir: number;
}
export function useItemDistribution() {
  const metadataStore = useMetadataStore();
  const tarkovStore = useTarkovStore();
  function getObjectiveCurrentCount(
    objective: NeededItemTaskObjective | NeededItemHideoutModule
  ): number {
    if (objective.needType === 'taskObjective') {
      return tarkovStore.getObjectiveCount(objective.id) ?? 0;
    }
    return tarkovStore.getHideoutPartCount(objective.id) ?? 0;
  }
  function sortTaskObjectives(objectives: NeededItemTaskObjective[]): NeededItemTaskObjective[] {
    return [...objectives].sort((a, b) => {
      const taskA = metadataStore.getTaskById(a.taskId);
      const taskB = metadataStore.getTaskById(b.taskId);
      const kappaA = taskA?.kappaRequired ? 0 : 1;
      const kappaB = taskB?.kappaRequired ? 0 : 1;
      if (kappaA !== kappaB) return kappaA - kappaB;
      const levelA = taskA?.minPlayerLevel ?? 999;
      const levelB = taskB?.minPlayerLevel ?? 999;
      return levelA - levelB;
    });
  }
  function sortHideoutModules(modules: NeededItemHideoutModule[]): NeededItemHideoutModule[] {
    return [...modules].sort((a, b) => {
      return a.hideoutModule.level - b.hideoutModule.level;
    });
  }
  function distributeItems(
    firCount: number,
    nonFirCount: number,
    taskObjectives: NeededItemTaskObjective[],
    hideoutModules: NeededItemHideoutModule[]
  ): DistributionResult {
    const updates: ObjectiveUpdate[] = [];
    const sortedTaskObjectives = sortTaskObjectives(taskObjectives);
    const sortedHideoutModules = sortHideoutModules(hideoutModules);
    let remainingFir = firCount;
    let remainingNonFir = nonFirCount;
    const taskFir = sortedTaskObjectives.filter((o) => o.foundInRaid);
    const taskNonFir = sortedTaskObjectives.filter((o) => !o.foundInRaid);
    const hideoutFir = sortedHideoutModules.filter((m) => m.foundInRaid);
    const hideoutNonFir = sortedHideoutModules.filter((m) => !m.foundInRaid);
    for (const obj of taskFir) {
      const current = getObjectiveCurrentCount(obj);
      const needed = Math.max(0, obj.count - current);
      if (needed > 0 && remainingFir > 0) {
        const toAssign = Math.min(needed, remainingFir);
        updates.push({
          id: obj.id,
          type: 'task',
          count: current + toAssign,
          needed: obj.count,
        });
        remainingFir -= toAssign;
      }
    }
    for (const obj of taskNonFir) {
      const current = getObjectiveCurrentCount(obj);
      const needed = Math.max(0, obj.count - current);
      if (needed > 0) {
        let toAssign = Math.min(needed, remainingNonFir);
        remainingNonFir -= toAssign;
        if (toAssign < needed && remainingFir > 0) {
          const fromFir = Math.min(needed - toAssign, remainingFir);
          toAssign += fromFir;
          remainingFir -= fromFir;
        }
        if (toAssign > 0) {
          updates.push({
            id: obj.id,
            type: 'task',
            count: current + toAssign,
            needed: obj.count,
          });
        }
      }
    }
    for (const mod of hideoutFir) {
      const current = getObjectiveCurrentCount(mod);
      const needed = Math.max(0, mod.count - current);
      if (needed > 0 && remainingFir > 0) {
        const toAssign = Math.min(needed, remainingFir);
        updates.push({
          id: mod.id,
          type: 'hideout',
          count: current + toAssign,
          needed: mod.count,
        });
        remainingFir -= toAssign;
      }
    }
    for (const mod of hideoutNonFir) {
      const current = getObjectiveCurrentCount(mod);
      const needed = Math.max(0, mod.count - current);
      if (needed > 0) {
        let toAssign = Math.min(needed, remainingNonFir);
        remainingNonFir -= toAssign;
        if (toAssign < needed && remainingFir > 0) {
          const fromFir = Math.min(needed - toAssign, remainingFir);
          toAssign += fromFir;
          remainingFir -= fromFir;
        }
        if (toAssign > 0) {
          updates.push({
            id: mod.id,
            type: 'hideout',
            count: current + toAssign,
            needed: mod.count,
          });
        }
      }
    }
    return { updates, remainingFir, remainingNonFir };
  }
  function applyDistribution(result: DistributionResult): void {
    for (const update of result.updates) {
      if (update.type === 'task') {
        tarkovStore.setObjectiveCount(update.id, update.count);
        if (update.count >= update.needed) {
          tarkovStore.setTaskObjectiveComplete(update.id);
        }
      } else {
        tarkovStore.setHideoutPartCount(update.id, update.count);
        if (update.count >= update.needed) {
          tarkovStore.setHideoutPartComplete(update.id);
        }
      }
    }
  }
  function resetObjectives(
    taskObjectives: NeededItemTaskObjective[],
    hideoutModules: NeededItemHideoutModule[]
  ): void {
    for (const obj of taskObjectives) {
      tarkovStore.setObjectiveCount(obj.id, 0);
    }
    for (const mod of hideoutModules) {
      tarkovStore.setHideoutPartCount(mod.id, 0);
    }
  }
  return {
    distributeItems,
    applyDistribution,
    resetObjectives,
    getObjectiveCurrentCount,
    sortTaskObjectives,
    sortHideoutModules,
  };
}
