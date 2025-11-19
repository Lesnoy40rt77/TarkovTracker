<template>
  <div class="needed-items-page">
    <tracker-tip :tip="{ id: 'neededitems' }"></tracker-tip>
    <v-container>
      <v-row align="center" dense>
        <v-col cols="9" sm="8" md="9" lg="8">
          <!-- Primary views (all, maps, traders) -->
          <v-card>
            <v-tabs
              v-model="activeNeededView"
              bg-color="accent"
              slider-color="secondary"
              align-tabs="center"
              show-arrows
            >
              <v-tab
                v-for="(view, index) in neededViews"
                :key="index"
                :value="view.view"
                :prepend-icon="view.icon"
              >
                {{ view.title }}
              </v-tab>
            </v-tabs>
          </v-card>
        </v-col>
        <v-col cols="3" sm="4" md="3" lg="3">
          <v-text-field
            v-model="itemFilterNameText"
            label="Search by item name"
            variant="solo"
            hide-details
            density="comfortable"
            :append-inner-icon="itemFilterNameText ? 'mdi-close-circle' : ''"
            @click:append-inner="clearItemFilterNameText"
          ></v-text-field>
        </v-col>
        <v-col cols="3" sm="2" md="1" lg="1">
          <v-dialog v-model="settingsDialog" scrim="#9A8866">
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                variant="tonal"
                style="width: 100%; height: 48px"
                class="px-0"
              >
                <v-icon>mdi-cog</v-icon>
              </v-btn>
            </template>
            <v-row class="justify-center">
              <v-col cols="auto">
                <v-card
                  :title="$t('page.neededitems.options.title')"
                  style="width: fit-content"
                >
                  <v-card-text>
                    <v-container class="ma-0 pa-0">
                      <v-row dense>
                        <!-- Choose needed items layout style -->
                        <v-col cols="12">
                          <v-btn-toggle
                            v-model="neededItemsStyle"
                            rounded="0"
                            group
                            variant="outlined"
                          >
                            <v-btn value="mediumCard" icon="mdi-view-grid">
                            </v-btn>
                            <v-btn value="smallCard" icon="mdi-view-comfy">
                            </v-btn>
                            <v-btn value="row" icon="mdi-view-sequential">
                            </v-btn>
                          </v-btn-toggle>
                        </v-col>
                        <!-- Hide Task Items that aren't needed found in raid option-->
                        <v-col cols="12">
                          <v-switch
                            v-model="hideFIR"
                            :label="$t(hideFIRLabel)"
                            inset
                            true-icon="mdi-eye-off"
                            false-icon="mdi-eye"
                            :color="hideFIRColor"
                            hide-details
                            density="compact"
                          ></v-switch>
                          <v-switch
                            v-model="itemsHideAll"
                            :label="$t(itemsHideAllLabel)"
                            inset
                            true-icon="mdi-eye-off"
                            false-icon="mdi-eye"
                            :color="itemsHideAllColor"
                            hide-details
                            density="compact"
                          ></v-switch>
                          <v-switch
                            v-model="itemsHideNonFIR"
                            :disabled="itemsHideAll"
                            :label="$t(itemsHideNonFIRLabel)"
                            inset
                            true-icon="mdi-eye-off"
                            false-icon="mdi-eye"
                            :color="itemsHideNonFIRColor"
                            hide-details
                            density="compact"
                          ></v-switch>
                          <v-switch
                            v-model="itemsHideHideout"
                            :disabled="itemsHideAll"
                            :label="$t(itemsHideHideoutLabel)"
                            inset
                            true-icon="mdi-eye-off"
                            false-icon="mdi-eye"
                            :color="itemsHideHideoutColor"
                            hide-details
                            density="compact"
                          ></v-switch>
                        </v-col>
                      </v-row>
                      <v-row justify="end">
                        <v-col cols="12" md="6">
                          <v-btn
                            color="primary"
                            block
                            @click="settingsDialog = false"
                            >{{ $t("page.neededitems.options.close") }}</v-btn
                          >
                        </v-col>
                      </v-row>
                    </v-container>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-dialog>
        </v-col>
      </v-row>
      <v-row v-if="loading || hideoutLoading" justify="center">
        <v-col cols="12" align="center">
          <v-progress-circular
            indeterminate
            color="secondary"
            class="mx-2"
          ></v-progress-circular>
          {{ $t("page.neededitems.loading") }} <refresh-button />
        </v-col>
      </v-row>
      <v-row
        v-show="activeNeededView == 'all' || activeNeededView == 'tasks'"
        justify="space-between"
      >
        <needed-item
          v-for="(neededItem, itemIndex) in visibleNeededTaskItems"
          :key="itemIndex"
          :need="neededItem"
          :item-style="neededItemsStyle"
        />
      </v-row>
      <v-row
        v-show="activeNeededView == 'all' || activeNeededView == 'hideout'"
        justify="space-between"
      >
        <needed-item
          v-for="(neededItem, itemIndex) in visibleNeededHideoutItems"
          :key="itemIndex"
          :need="neededItem"
          :item-style="neededItemsStyle"
        />
      </v-row>
      <div
        v-if="
          (activeNeededView == 'tasks' &&
            neededTaskItems.length > itemsLimit) ||
          (activeNeededView == 'hideout' &&
            neededHideoutItems.length > itemsLimit) ||
          (activeNeededView == 'all' &&
            (neededTaskItems.length > itemsLimit ||
              neededHideoutItems.length > itemsLimit))
        "
        ref="loadTrigger"
        class="py-4"
      ></div>
    </v-container>
  </div>
</template>
<script setup>
import {
  computed,
  provide,
  ref,
  watch,
  defineAsyncComponent,
  onMounted,
  onUnmounted,
} from "vue";
import { useTarkovData } from "@/composables/tarkovdata";
import { useProgressStore } from "@/stores/progress";
import { useTarkovStore } from "@/stores/tarkov";
import { STASH_STATION_ID } from "@/utils/constants";
import { debounce } from "@/utils/debounce";
import { useI18n } from "vue-i18n";
import { useUserStore } from "@/stores/user";
const TrackerTip = defineAsyncComponent(
  () => import("@/features/ui/TrackerTip.vue")
);
const RefreshButton = defineAsyncComponent(
  () => import("@/features/ui/RefreshButton.vue")
);
const NeededItem = defineAsyncComponent(
  () => import("@/features/neededitems/NeededItem.vue")
);
const { t } = useI18n({ useScope: "global" });
const {
  tasks,
  hideoutModules,
  hideoutLoading,
  loading,
  neededItemTaskObjectives,
  neededItemHideoutModules,
} = useTarkovData();
const progressStore = useProgressStore();
const userStore = useUserStore();
const tarkovStore = useTarkovStore();
const itemFilterNameText = ref("");
function clearItemFilterNameText() {
  if (itemFilterNameText.value) itemFilterNameText.value = "";
}
const itemFilterName = ref("");
provide("itemFilterName", itemFilterName);
watch(
  itemFilterNameText,
  debounce((newVal) => {
    itemFilterName.value = newVal;
  }, 50)
);

const itemsLimit = ref(48);
const visibleNeededTaskItems = computed(() =>
  neededTaskItems.value.slice(0, itemsLimit.value)
);
const visibleNeededHideoutItems = computed(() =>
  neededHideoutItems.value.slice(0, itemsLimit.value)
);

function loadMore() {
  itemsLimit.value += 48;
}

const loadTrigger = ref(null);
let observer = null;

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        loadMore();
      }
    },
    {
      rootMargin: "200px",
    }
  );
});

watch(loadTrigger, (newVal) => {
  if (newVal && observer) {
    observer.disconnect(); // Disconnect previous observation
    observer.observe(newVal);
  }
});

onUnmounted(() => {
  if (observer) {
    observer.disconnect();
  }
});

const neededItemsStyle = computed({
  get: () => userStore.getNeededItemsStyle,
  set: (value) => userStore.setNeededItemsStyle(value),
});
const settingsDialog = ref(false);
const neededViews = [
  {
    title: t("page.neededitems.neededviews.all"),
    icon: "mdi-all-inclusive",
    view: "all",
  },
  {
    title: t("page.neededitems.neededviews.tasks"),
    icon: "mdi-clipboard-text",
    view: "tasks",
  },
  {
    title: t("page.neededitems.neededviews.hideout"),
    icon: "mdi-home",
    view: "hideout",
  },
];
const activeNeededView = computed({
  get: () => userStore.getNeededTypeView,
  set: (value) => userStore.setNeededTypeView(value),
});

// Reset limit when view changes or filter changes
watch([activeNeededView, itemFilterName], () => {
  itemsLimit.value = 48;
});
const neededTaskItems = computed(() => {
  const objectives = neededItemTaskObjectives?.value;
  const taskList = tasks?.value;
  if (!Array.isArray(objectives) || !Array.isArray(taskList)) {
    return [];
  }
  try {
    // Create Map for O(1) task lookups instead of O(m) find() in each comparison
    const taskMap = new Map(taskList.map((t) => [t.id, t]));

    // Filter objectives based on user settings and progress
    const filteredObjectives = objectives.filter((need) => {
      // ONLY allow 'giveItem' objectives, and ensure an item exists
      if (need.type !== "giveItem" || !need.item) {
        return false;
      }

      // Filter by name if search text is present
      if (itemFilterName.value) {
        const filterText = itemFilterName.value.toLowerCase();
        const matchesName =
          need.item.shortName.toLowerCase().includes(filterText) ||
          need.item.name.toLowerCase().includes(filterText);
        if (!matchesName) return false;
      }

      const relatedTask = taskMap.get(need.taskId);
      if (!relatedTask) return false;

      if (userStore.itemsNeededHideNonFIR) {
        if (need.foundInRaid == false) {
          return false;
        }
      }

      if (userStore.hideNonKappaTasks && !relatedTask.kappaRequired) {
        return false;
      }

      if (userStore.itemsTeamAllHidden) {
        // Only show if the objective is needed by ourself
        return (
          !progressStore.tasksCompletions[need.taskId]?.self &&
          !progressStore.objectiveCompletions[need.id]?.self &&
          ["Any", tarkovStore.getPMCFaction].some(
            (faction) => faction == relatedTask.factionName
          )
        );
      } else if (userStore.itemsTeamNonFIRHidden) {
        // Only show if a someone needs the objective
        const taskNeeded = Object.entries(
          progressStore.tasksCompletions[need.taskId] || {}
        ).some(([userTeamId, userStatus]) => {
          const relevantFactions = [
            "Any",
            progressStore.playerFaction[userTeamId],
          ];
          return (
            relevantFactions.some(
              (faction) => faction == relatedTask.factionName
            ) && userStatus === false
          );
        });
        const objectiveNeeded = Object.entries(
          progressStore.objectiveCompletions[need.id] || {}
        ).some(([userTeamId, userStatus]) => {
          const relevantFactions = [
            "Any",
            progressStore.playerFaction[userTeamId],
          ];
          return (
            relevantFactions.some(
              (faction) => faction == relatedTask.factionName
            ) && userStatus === false
          );
        });
        return need.foundInRaid && taskNeeded && objectiveNeeded;
      } else {
        return (
          Object.entries(
            progressStore.tasksCompletions[need.taskId] || {}
          ).some(([userTeamId, userStatus]) => {
            const relevantFactions = [
              "Any",
              progressStore.playerFaction[userTeamId],
            ];
            return (
              relevantFactions.some(
                (faction) => faction == relatedTask.factionName
              ) && userStatus === false
            );
          }) &&
          Object.entries(
            progressStore.objectiveCompletions[need.id] || {}
          ).some(([userTeamId, userStatus]) => {
            const relevantFactions = [
              "Any",
              progressStore.playerFaction[userTeamId],
            ];
            return (
              relevantFactions.some(
                (faction) => faction == relatedTask.factionName
              ) && userStatus === false
            );
          })
        );
      }
    });

    // Pre-compute predecessor counts for each objective to avoid redundant work
    const objectivesWithCounts = filteredObjectives.map((obj) => {
      const task = taskMap.get(obj.taskId);
      let predecessorCount = 0;

      if (task?.predecessors) {
        task.predecessors.forEach((predecessor) => {
          if (
            progressStore.tasksCompletions?.[predecessor]?.["self"] === false
          ) {
            predecessorCount++;
          }
        });
      }

      return {
        ...obj,
        predecessorCount,
      };
    });

    // Simple numeric sort on pre-computed counts
    return objectivesWithCounts.sort(
      (a, b) => a.predecessorCount - b.predecessorCount
    );
  } catch (error) {
    console.error("Error processing neededTaskItems:", error);
    return [];
  }
});
const neededHideoutItems = computed(() => {
  const modulesNeeded = neededItemHideoutModules?.value;
  const moduleList = hideoutModules?.value;
  if (!Array.isArray(modulesNeeded) || !Array.isArray(moduleList)) {
    return [];
  }
  try {
    // Filter incomplete items
    const filteredNeeds = modulesNeeded.filter((need) => {
      const moduleInstanceId = need.hideoutModule?.id;
      const moduleStationId = need.hideoutModule?.stationId;
      const moduleTargetLevel = need.hideoutModule?.level;
      if (
        !moduleInstanceId ||
        !moduleStationId ||
        typeof moduleTargetLevel !== "number"
      ) {
        return true;
      }
      if (moduleStationId === STASH_STATION_ID) {
        const currentEffectiveStashLevel =
          progressStore.hideoutLevels?.[STASH_STATION_ID]?.["self"];
        if (typeof currentEffectiveStashLevel === "number") {
          return currentEffectiveStashLevel < moduleTargetLevel;
        }
        return (
          progressStore.teamStores?.["self"]?.$state?.hideoutModules?.[
            moduleInstanceId
          ]?.complete !== true
        );
      } else {
        const selfTeamStore = progressStore.teamStores?.["self"];
        const hideoutModules = selfTeamStore?.$state?.hideoutModules;
        const module = hideoutModules?.[moduleInstanceId];
        return module?.complete !== true;
      }
    });

    // Create Map for O(1) lookups
    const moduleMap = new Map(moduleList.map((m) => [m.id, m]));

    // Pre-compute predecessor counts
    const needsWithCounts = filteredNeeds.map((need) => {
      const module = moduleMap.get(need.hideoutModule?.id);
      let predecessorCount = 0;

      if (module?.predecessors) {
        module.predecessors.forEach((predecessor) => {
          if (
            progressStore.moduleCompletions?.[predecessor]?.["self"] === false
          ) {
            predecessorCount++;
          }
        });
      }

      return {
        ...need,
        predecessorCount,
      };
    });

    // Simple numeric sort on pre-computed counts
    return needsWithCounts.sort(
      (a, b) => a.predecessorCount - b.predecessorCount
    );
  } catch (error) {
    console.error("Error processing neededHideoutItems:", error);
    return [];
  }
});
const hideFIR = computed({
  get: () => userStore.itemsNeededHideNonFIR,
  set: (value) => userStore.setItemsNeededHideNonFIR(value),
});
const hideFIRLabel = computed(() =>
  userStore.itemsNeededHideNonFIR
    ? "page.neededitems.options.items_hide_non_fir"
    : "page.neededitems.options.items_show_non_fir"
);
const hideFIRColor = computed(() =>
  userStore.itemsNeededHideNonFIR ? "error" : "success"
);
const itemsHideAll = computed({
  get: () => userStore.itemsTeamAllHidden,
  set: (value) => userStore.setItemsTeamHideAll(value),
});
const itemsHideAllLabel = computed(() =>
  userStore.itemsTeamAllHidden
    ? "page.team.card.teamoptions.items_hide_all"
    : "page.team.card.teamoptions.items_show_all"
);
const itemsHideAllColor = computed(() =>
  userStore.itemsTeamAllHidden ? "error" : "success"
);
const itemsHideNonFIR = computed({
  get: () => userStore.itemsTeamNonFIRHidden,
  set: (value) => userStore.setItemsTeamHideNonFIR(value),
});
const itemsHideNonFIRLabel = computed(() =>
  userStore.itemsTeamNonFIRHidden
    ? "page.team.card.teamoptions.items_hide_non_fir"
    : "page.team.card.teamoptions.items_show_non_fir"
);
const itemsHideNonFIRColor = computed(() =>
  userStore.itemsTeamNonFIRHidden ? "error" : "success"
);
const itemsHideHideout = computed({
  get: () => userStore.itemsTeamHideoutHidden,
  set: (value) => userStore.setItemsTeamHideHideout(value),
});
const itemsHideHideoutLabel = computed(() =>
  userStore.itemsTeamHideoutHidden
    ? "page.team.card.teamoptions.items_hide_hideout"
    : "page.team.card.teamoptions.items_show_hideout"
);
const itemsHideHideoutColor = computed(() =>
  userStore.itemsTeamHideoutHidden ? "error" : "success"
);
</script>
<style lang="scss" scoped></style>
