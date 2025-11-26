<template>
  <GenericCard
    icon="mdi-account-wrench"
    icon-color="white"
    highlight-color="secondary"
  >
    <template #title>
      {{ $t("page.team.card.teamoptions.title") }}
    </template>
    <template #content>
      <div class="p-4 space-y-4">
        <div class="flex items-center justify-between">
          <div class="text-sm font-medium">{{ $t(taskHideAllLabel) }}</div>
          <UToggle
            v-model="taskHideAll"
            on-icon="i-mdi-eye-off"
            off-icon="i-mdi-eye"
            color="red"
          />
        </div>
        <div class="flex items-center justify-between">
          <div class="text-sm font-medium">{{ $t(itemsHideAllLabel) }}</div>
          <UToggle
            v-model="itemsHideAll"
            on-icon="i-mdi-eye-off"
            off-icon="i-mdi-eye"
            color="red"
          />
        </div>
        <div class="flex items-center justify-between">
          <div
            class="text-sm font-medium"
            :class="{ 'opacity-50': itemsHideAll }"
          >
            {{ $t(itemsHideNonFIRLabel) }}
          </div>
          <UToggle
            v-model="itemsHideNonFIR"
            :disabled="itemsHideAll"
            on-icon="i-mdi-eye-off"
            off-icon="i-mdi-eye"
            color="red"
          />
        </div>
        <div class="flex items-center justify-between">
          <div
            class="text-sm font-medium"
            :class="{ 'opacity-50': itemsHideAll }"
          >
            {{ $t(itemsHideHideoutLabel) }}
          </div>
          <UToggle
            v-model="itemsHideHideout"
            :disabled="itemsHideAll"
            on-icon="i-mdi-eye-off"
            off-icon="i-mdi-eye"
            color="red"
          />
        </div>
        <div class="flex items-center justify-between">
          <div class="text-sm font-medium">{{ $t(mapHideAllLabel) }}</div>
          <UToggle
            v-model="mapHideAll"
            on-icon="i-mdi-eye-off"
            off-icon="i-mdi-eye"
            color="red"
          />
        </div>
      </div>
    </template>
  </GenericCard>
</template>
<script setup>
import { computed } from "vue";
import { usePreferencesStore } from "@/stores/preferences";
import GenericCard from "@/components/ui/GenericCard.vue";
const preferencesStore = usePreferencesStore();
const taskHideAll = computed({
  get: () => preferencesStore.taskTeamAllHidden,
  set: (value) => preferencesStore.setQuestTeamHideAll(value),
});
const taskHideAllLabel = computed(() =>
  preferencesStore.taskTeamAllHidden
    ? "page.team.card.teamoptions.task_hide_all"
    : "page.team.card.teamoptions.task_show_all"
);
const itemsHideAll = computed({
  get: () => preferencesStore.itemsTeamAllHidden,
  set: (value) => preferencesStore.setItemsTeamHideAll(value),
});
const itemsHideAllLabel = computed(() =>
  preferencesStore.itemsTeamAllHidden
    ? "page.team.card.teamoptions.items_hide_all"
    : "page.team.card.teamoptions.items_show_all"
);
const itemsHideNonFIR = computed({
  get: () => preferencesStore.itemsTeamNonFIRHidden,
  set: (value) => preferencesStore.setItemsTeamHideNonFIR(value),
});
const itemsHideNonFIRLabel = computed(() =>
  preferencesStore.itemsTeamNonFIRHidden
    ? "page.team.card.teamoptions.items_hide_non_fir"
    : "page.team.card.teamoptions.items_show_non_fir"
);
const itemsHideHideout = computed({
  get: () => preferencesStore.itemsTeamHideoutHidden,
  set: (value) => preferencesStore.setItemsTeamHideHideout(value),
});
const itemsHideHideoutLabel = computed(() =>
  preferencesStore.itemsTeamHideoutHidden
    ? "page.team.card.teamoptions.items_hide_hideout"
    : "page.team.card.teamoptions.items_show_hideout"
);
const mapHideAll = computed({
  get: () => preferencesStore.mapTeamAllHidden,
  set: (value) => preferencesStore.setMapTeamHideAll(value),
});
const mapHideAllLabel = computed(() =>
  preferencesStore.mapTeamAllHidden
    ? "page.team.card.teamoptions.map_hide_all"
    : "page.team.card.teamoptions.map_show_all"
);
</script>
<style scoped></style>