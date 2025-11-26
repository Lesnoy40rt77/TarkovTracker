<template>
  <span>
    <div
      class="flex items-center p-1 rounded cursor-pointer transition-colors duration-200"
      :class="{
        'bg-linear-to-b from-green-500/20 to-transparent': isComplete,
        'hover:bg-white/5': !isComplete,
      }"
      @click="toggleObjectiveCompletion()"
      @mouseenter="objectiveMouseEnter()"
      @mouseleave="objectiveMouseLeave()"
    >
      <UIcon
        :name="
          objectiveIcon.startsWith('mdi-')
            ? `i-${objectiveIcon}`
            : objectiveIcon
        "
        class="mr-1 w-4 h-4 shrink-0"
      />
      <span class="text-sm">{{ props.objective?.description }}</span>
    </div>
    <div
      v-if="
        fullObjective &&
        ((systemStore.userTeam && userNeeds.length > 0) ||
          itemObjectiveTypes.includes(fullObjective.type))
      "
      class="flex items-center mt-px mb-px text-xs"
    >
      <div
        v-if="fullObjective && itemObjectiveTypes.includes(fullObjective.type)"
        class="flex items-center"
      >
        <div class="rounded-lg pr-0 flex items-start mb-2 bg-gray-800 w-fit">
          <GameItem
            :item-id="relatedItem.id"
            :item-name="relatedItem.shortName"
            :dev-link="relatedItem.link"
            :wiki-link="relatedItem.wikiLink"
            :count="fullObjective.count ?? 1"
            class="mr-2"
          />
        </div>
      </div>
      <div
        v-if="systemStore.userTeam && userNeeds.length > 0"
        class="flex items-center"
      >
        <span
          v-for="(user, userIndex) in userNeeds"
          :key="userIndex"
          class="flex items-center"
        >
          <UIcon name="i-mdi-account-child-circle" class="ml-1 w-4 h-4" />
          {{ progressStore.teammemberNames[user] }}
        </span>
      </div>
      <div v-if="objective.type === 'mark'">
        <!-- Mark specific content -->
      </div>
      <div v-if="objective.type === 'zone'">
        <!-- Zone specific content -->
      </div>
    </div>
  </span>
</template>
<script setup>
import { computed, ref, defineAsyncComponent } from "vue";
import { useTarkovStore } from "@/stores/tarkov";
import { useMetadataStore } from "@/stores/metadata";
import { useProgressStore } from "@/stores/progress";
import { useSystemStoreWithSupabase } from "@/stores/useSystemStore";
const { systemStore } = useSystemStoreWithSupabase();
// Define the props for the component
const props = defineProps({
  objective: {
    type: Object,
    required: true,
  },
});

const metadataStore = useMetadataStore();
const objectives = computed(() => metadataStore.objectives);
const tarkovStore = useTarkovStore();
const progressStore = useProgressStore();
const isComplete = computed(() => {
  return tarkovStore.isTaskObjectiveComplete(props.objective.id);
});
const fullObjective = computed(() => {
  return objectives.value.find((o) => o.id == props.objective.id);
});
const itemObjectiveTypes = ["giveItem", "mark", "buildWeapon", "plantItem"];
const relatedItem = computed(() => {
  if (!fullObjective.value) {
    return null;
  }
  switch (fullObjective.value.type) {
    case "giveItem":
      return fullObjective.value.item;
    case "mark":
      return fullObjective.value.markerItem;
    case "buildWeapon": {
      // Prefer the defaultPreset (full build) if available
      const item = fullObjective.value.item;
      if (item?.properties?.defaultPreset) {
        return item.properties.defaultPreset;
      }
      return item;
    }
    case "plantItem":
      return fullObjective.value.item;
    default:
      return null;
  }
});
const userNeeds = computed(() => {
  const needingUsers = [];
  if (fullObjective.value == undefined) {
    return needingUsers;
  }
  Object.entries(
    progressStore.unlockedTasks[fullObjective.value.taskId]
  ).forEach(([teamId, unlocked]) => {
    if (
      unlocked &&
      progressStore.objectiveCompletions?.[props.objective.id]?.[teamId] ==
        false
    ) {
      needingUsers.push(teamId);
    }
  });
  return needingUsers;
});
const isHovered = ref(false);
const objectiveMouseEnter = () => {
  isHovered.value = true;
};
const objectiveMouseLeave = () => {
  isHovered.value = false;
};
const objectiveIcon = computed(() => {
  if (isHovered.value) {
    if (isComplete.value) {
      return "mdi-close-circle";
    } else {
      return "mdi-check-circle";
    }
  }
  const iconMap = {
    key: "mdi-key",
    shoot: "mdi-target-account",
    giveItem: "mdi-close-circle-outline",
    findItem: "mdi-checkbox-marked-circle-outline",
    findQuestItem: "mdi-alert-circle-outline",
    giveQuestItem: "mdi-alert-circle-check-outline",
    plantQuestItem: "mdi-arrow-down-thin-circle-outline",
    plantItem: "mdi-arrow-down-thin-circle-outline",
    taskStatus: "mdi-account-child-circle",
    extract: "mdi-heart-circle-outline",
    mark: "mdi-remote",
    place: "mdi-arrow-down-drop-circle-outline",
    traderLevel: "mdi-thumb-up",
    traderStanding: "mdi-thumb-up",
    skill: "mdi-dumbbell",
    visit: "mdi-crosshairs-gps",
    buildWeapon: "mdi-progress-wrench",
    playerLevel: "mdi-crown-circle-outline",
    experience: "mdi-eye-circle-outline",
    warning: "mdi-alert-circle",
  };
  return iconMap[props.objective.type] || "mdi-help-circle";
});
const toggleObjectiveCompletion = () => {
  tarkovStore.toggleTaskObjectiveComplete(props.objective.id);
};
</script>