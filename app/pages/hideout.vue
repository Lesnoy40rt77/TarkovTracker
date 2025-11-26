<template>
  <div class="container mx-auto px-4 py-6 space-y-4 min-h-[calc(100vh-250px)]">
    <div class="flex justify-center">
      <UCard class="w-full max-w-4xl bg-surface-900 border border-white/10">
        <div class="flex flex-wrap gap-2 justify-center">
          <UButton
            v-for="view in primaryViews"
            :key="view.view"
            :icon="`i-${view.icon}`"
            :variant="hideoutFiltering.activePrimaryView === view.view ? 'solid' : 'ghost'"
            :color="hideoutFiltering.activePrimaryView === view.view ? 'primary' : 'neutral'"
            size="sm"
            class="min-w-[140px] justify-center"
            @click="hideoutFiltering.activePrimaryView = view.view"
          >
            {{ view.title }}
          </UButton>
        </div>
      </UCard>
    </div>

    <div>
      <div
        v-if="hideoutFiltering.isStoreLoading"
        class="flex flex-col items-center gap-3 text-surface-200 py-10"
      >
        <UIcon
          name="i-heroicons-arrow-path"
          class="w-8 h-8 animate-spin text-primary-500"
        />
        <div class="flex items-center gap-2 text-sm">
          {{ $t("page.hideout.loading") }}
          <RefreshButton />
        </div>
      </div>

      <div
        v-else-if="hideoutFiltering.visibleStations.length === 0"
        class="flex justify-center"
      >
        <UAlert
          icon="i-mdi-clipboard-search"
          color="neutral"
          variant="soft"
          class="max-w-xl"
          :title="$t('page.hideout.nostationsfound')"
        />
      </div>

      <div
        v-else
        class="grid gap-3 mt-2 grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
      >
        <HideoutCard
          v-for="(hStation, hIndex) in hideoutFiltering.visibleStations"
          :key="hIndex"
          :station="hStation"
          class="h-full"
        />
      </div>
    </div>
  </div>
</template>
<script setup>
import { defineAsyncComponent } from "vue";
import { useI18n } from "vue-i18n";
import { useHideoutFiltering } from "@/composables/useHideoutFiltering";

const HideoutCard = defineAsyncComponent(() =>
  import("@/features/hideout/HideoutCard.vue")
);
const RefreshButton = defineAsyncComponent(() =>
  import("@/components/ui/RefreshButton.vue")
);
const { t } = useI18n({ useScope: "global" });

// Hideout filtering composable
const hideoutFiltering = useHideoutFiltering();

const primaryViews = [
  {
    title: t("page.hideout.primaryviews.available"),
    icon: "mdi-tag-arrow-up-outline",
    view: "available",
  },
  {
    title: t("page.hideout.primaryviews.maxed"),
    icon: "mdi-arrow-collapse-up",
    view: "maxed",
  },
  {
    title: t("page.hideout.primaryviews.locked"),
    icon: "mdi-lock",
    view: "locked",
  },
  {
    title: t("page.hideout.primaryviews.all"),
    icon: "mdi-clipboard-check",
    view: "all",
  },
];
</script>
<style lang="scss" scoped></style>