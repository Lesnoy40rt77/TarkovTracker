<template>
  <div class="space-y-3 mb-4">
    <!-- Primary View Filter: ALL / MAPS / TRADERS -->
    <div class="flex flex-wrap items-center gap-2">
      <UButton
        :variant="primaryView === 'all' ? 'solid' : 'outline'"
        :color="primaryView === 'all' ? 'primary' : 'neutral'"
        size="sm"
        @click="setPrimaryView('all')"
      >
        <UIcon name="i-mdi-checkbox-multiple-marked" class="w-4 h-4 mr-1" />
        {{ t("page.tasks.primaryviews.all") }}
      </UButton>

      <UButton
        :variant="primaryView === 'maps' ? 'solid' : 'outline'"
        :color="primaryView === 'maps' ? 'primary' : 'neutral'"
        size="sm"
        @click="setPrimaryView('maps')"
      >
        <UIcon name="i-mdi-map" class="w-4 h-4 mr-1" />
        {{ t("page.tasks.primaryviews.maps") }}
      </UButton>

      <UButton
        :variant="primaryView === 'traders' ? 'solid' : 'outline'"
        :color="primaryView === 'traders' ? 'primary' : 'neutral'"
        size="sm"
        @click="setPrimaryView('traders')"
      >
        <UIcon name="i-mdi-account-group" class="w-4 h-4 mr-1" />
        {{ t("page.tasks.primaryviews.traders") }}
      </UButton>

      <!-- Map selector (shown when MAPS is selected) -->
      <USelectMenu
        v-if="primaryView === 'maps' && maps.length > 0"
        :model-value="selectedMapObject"
        :items="mapOptions"
        class="min-w-[180px]"
        size="sm"
        @update:model-value="onMapSelect"
      >
        <template #leading>
          <UIcon name="i-mdi-map-marker" class="w-4 h-4" />
        </template>
      </USelectMenu>

      <!-- Trader selector (shown when TRADERS is selected) -->
      <USelectMenu
        v-if="primaryView === 'traders' && traders.length > 0"
        :model-value="selectedTraderObject"
        :items="traderOptions"
        class="min-w-[180px]"
        size="sm"
        @update:model-value="onTraderSelect"
      >
        <template #leading>
          <UIcon name="i-mdi-account" class="w-4 h-4" />
        </template>
      </USelectMenu>
    </div>

    <!-- Secondary View Filter: AVAILABLE / LOCKED / COMPLETED -->
    <div class="flex flex-wrap items-center gap-2">
      <UButton
        :variant="secondaryView === 'available' ? 'solid' : 'outline'"
        :color="secondaryView === 'available' ? 'primary' : 'neutral'"
        size="sm"
        @click="setSecondaryView('available')"
      >
        <UIcon name="i-mdi-checkbox-blank-circle" class="w-4 h-4 mr-1" />
        {{ t("page.tasks.secondaryviews.available") }}
      </UButton>

      <UButton
        :variant="secondaryView === 'locked' ? 'solid' : 'outline'"
        :color="secondaryView === 'locked' ? 'primary' : 'neutral'"
        :disabled="preferencesStore.getTaskUserView === 'all'"
        size="sm"
        @click="setSecondaryView('locked')"
      >
        <UIcon name="i-mdi-lock" class="w-4 h-4 mr-1" />
        {{ t("page.tasks.secondaryviews.locked") }}
      </UButton>

      <UButton
        :variant="secondaryView === 'completed' ? 'solid' : 'outline'"
        :color="secondaryView === 'completed' ? 'primary' : 'neutral'"
        :disabled="preferencesStore.getTaskUserView === 'all'"
        size="sm"
        @click="setSecondaryView('completed')"
      >
        <UIcon name="i-mdi-check-circle" class="w-4 h-4 mr-1" />
        {{ t("page.tasks.secondaryviews.completed") }}
      </UButton>

      <!-- User View Selector (Yourself / All) -->
      <div class="ml-auto flex items-center gap-2">
        <USelectMenu
          :model-value="userViewObject"
          :items="userViewOptions"
          class="min-w-[140px]"
          size="sm"
          @update:model-value="onUserViewSelect"
        >
          <template #leading>
            <UIcon name="i-mdi-account-outline" class="w-4 h-4" />
          </template>
        </USelectMenu>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { usePreferencesStore } from "@/stores/preferences";
import { useMetadataStore } from "@/stores/metadata";

const { t } = useI18n({ useScope: "global" });
const preferencesStore = usePreferencesStore();
const metadataStore = useMetadataStore();
const maps = computed(() => metadataStore.maps);
const traders = computed(() => metadataStore.traders);

// Primary view (all / maps / traders)
const primaryView = computed(() => preferencesStore.getTaskPrimaryView);

const setPrimaryView = (view: string) => {
  preferencesStore.setTaskPrimaryView(view);

  // When switching to maps, ensure a map is selected
  if (
    view === "maps" &&
    maps.value.length > 0 &&
    preferencesStore.getTaskMapView === "all"
  ) {
    const firstMap = maps.value[0];
    if (firstMap?.id) {
      preferencesStore.setTaskMapView(firstMap.id);
    }
  }

  // When switching to traders, ensure a trader is selected
  if (
    view === "traders" &&
    traders.value.length > 0 &&
    preferencesStore.getTaskTraderView === "all"
  ) {
    const firstTrader = traders.value[0];
    if (firstTrader?.id) {
      preferencesStore.setTaskTraderView(firstTrader.id);
    }
  }
};

// Secondary view (available / locked / completed)
const secondaryView = computed(() => preferencesStore.getTaskSecondaryView);

const setSecondaryView = (view: string) => {
  preferencesStore.setTaskSecondaryView(view);
};

// Map selection
const mapOptions = computed(() => {
  return maps.value.map((map) => ({
    label: map.name,
    value: map.id,
  }));
});

const selectedMapObject = computed(() => {
  const currentMapId = preferencesStore.getTaskMapView;
  return (
    mapOptions.value.find((option) => option.value === currentMapId) ||
    mapOptions.value[0]
  );
});

const onMapSelect = (selected: { label: string; value: string }) => {
  if (selected?.value) {
    preferencesStore.setTaskMapView(selected.value);
  }
};

// Trader selection
const traderOptions = computed(() => {
  return traders.value.map((trader) => ({
    label: trader.name,
    value: trader.id,
  }));
});

const selectedTraderObject = computed(() => {
  const currentTraderId = preferencesStore.getTaskTraderView;
  return (
    traderOptions.value.find((option) => option.value === currentTraderId) ||
    traderOptions.value[0]
  );
});

const onTraderSelect = (selected: { label: string; value: string }) => {
  if (selected?.value) {
    preferencesStore.setTaskTraderView(selected.value);
  }
};

// User view selection (yourself / all team members)
const userViewOptions = computed(() => [
  {
    label: t("page.tasks.userviews.yourself"),
    value: "self",
  },
  {
    label: t("page.tasks.userviews.all"),
    value: "all",
  },
]);

const userViewObject = computed(() => {
  const currentUserView = preferencesStore.getTaskUserView;
  return (
    userViewOptions.value.find((option) => option.value === currentUserView) ||
    userViewOptions.value[0]
  );
});

const onUserViewSelect = (selected: { label: string; value: string }) => {
  if (selected?.value) {
    preferencesStore.setTaskUserView(selected.value);

    // When switching to "all" users view, force secondary view to "available"
    // since the filtering logic only supports "available" for team view
    if (
      selected.value === "all" &&
      preferencesStore.getTaskSecondaryView !== "available"
    ) {
      preferencesStore.setTaskSecondaryView("available");
    }
  }
};
</script>