<template>
  <GenericCard
    :title="station.name"
    :subtitle="getSubtitleText()"
    :avatar="stationAvatar"
    :highlight-color="getHighlightColor()"
    avatar-height="50"
    class="rounded-lg relative overflow-visible"
    header-classes="pb-2"
  >
    <template #title-right>
      <span class="text-xs text-gray-400" :hidden="upgradeDisabled">
        <i18n-t
          keypath="page.hideout.stationcard.level"
          scope="global"
          :plural="progressStore.hideoutLevels?.[props.station.id]?.self || 0"
        >
          <template #level>
            {{ progressStore.hideoutLevels?.[props.station.id]?.self || 0 }}
          </template>
        </i18n-t>
      </span>
    </template>

    <template #content>
      <!-- Station description -->
      <div
        v-if="currentLevel"
        class="text-center text-xs mb-2 mx-2 text-gray-300"
      >
        {{ getStashAdjustedDescription(currentLevel.description) }}
      </div>
      <div
        v-else-if="nextLevel"
        class="text-center text-xs mb-2 mx-2 text-gray-300"
      >
        {{ getStashAdjustedDescription(nextLevel.description) }}
      </div>

      <!-- Stash station special content -->
      <div
        v-if="props.station.id == STASH_STATION_ID"
        class="text-center p-2 bg-gray-700"
      >
        <div class="mb-2 text-sm">
          {{ $t("page.hideout.stationcard.gameeditiondescription") }}
        </div>
        <UButton variant="soft" to="/settings" color="white">{{
          $t("page.hideout.stationcard.settingsbutton")
        }}</UButton>
      </div>

      <!-- Next level requirements -->
      <div v-if="nextLevel" class="mb-1 bg-gray-800">
        <div class="text-center p-2">
          <div
            class="text-base font-medium mb-2 flex items-center justify-center"
          >
            <UIcon
              name="i-mdi-package-variant-closed-check"
              class="mr-2 w-6 h-6"
            />
            {{ $t("page.hideout.stationcard.nextlevel") }}
          </div>
          <div
            v-for="(requirement, rIndex) in nextLevel.itemRequirements"
            :key="rIndex"
          >
            <span class="flex items-center justify-center">
              <GameItem
                :item-id="requirement.item.id"
                :item-name="requirement.item.name"
                :dev-link="requirement.item.link"
                :wiki-link="requirement.item.wikiLink"
                :count="requirement.count"
                class="mr-2 inline-block"
              />
            </span>
          </div>
          <div
            v-for="(requirement, rIndex) in nextLevel.stationLevelRequirements"
            :key="rIndex"
            class="text-sm text-gray-300"
          >
            <i18n-t
              keypath="page.hideout.stationcard.requirements.station"
              scope="global"
            >
              <template #level>
                {{ requirement.level }}
              </template>
              <template #stationname>
                {{ requirement.station.name }}
              </template>
            </i18n-t>
          </div>
          <div
            v-for="(requirement, rIndex) in nextLevel.skillRequirements"
            :key="rIndex"
            class="text-sm text-gray-300"
          >
            <i18n-t
              keypath="page.hideout.stationcard.requirements.skill"
              scope="global"
            >
              <template #level>
                {{ requirement.level }}
              </template>
              <template #skillname>
                {{ requirement.name }}
              </template>
            </i18n-t>
          </div>
          <div
            v-for="(requirement, rIndex) in nextLevel.traderRequirements"
            :key="rIndex"
            class="text-sm text-gray-300"
          >
            <i18n-t
              keypath="page.hideout.stationcard.requirements.trader"
              scope="global"
            >
              <template #loyaltylevel>
                {{ requirement.value }}
              </template>
              <template #tradername>
                {{ requirement.trader.name }}
              </template>
            </i18n-t>
          </div>
        </div>
      </div>

      <!-- Max level indicator -->
      <div v-if="!nextLevel" class="p-2 rounded bg-gray-800">
        <div
          class="text-center text-base font-medium flex items-center justify-center text-yellow-500"
        >
          <UIcon name="i-mdi-star-check" class="mr-2 w-6 h-6" />
          {{ $t("page.hideout.stationcard.maxlevel") }}
        </div>
      </div>
    </template>

    <template #footer>
      <div class="mb-2 p-2">
        <div
          v-if="!upgradeDisabled"
          class="flex items-center justify-center flex-wrap"
        >
          <div v-if="nextLevel?.level" class="mx-1 my-1">
            <UButton
              color="green"
              variant="soft"
              size="sm"
              class="my-1"
              @click="upgradeStation()"
            >
              <i18n-t
                keypath="page.hideout.stationcard.upgradebutton"
                scope="global"
                :plural="nextLevel?.level"
              >
                <template #level>
                  {{ nextLevel?.level }}
                </template>
              </i18n-t>
            </UButton>
          </div>
          <div v-if="currentLevel" class="mx-1 my-1">
            <UButton
              color="red"
              variant="soft"
              size="sm"
              :disabled="downgradeDisabled"
              class="my-1"
              @click="downgradeStation()"
            >
              <i18n-t
                keypath="page.hideout.stationcard.downgradebutton"
                scope="global"
                :plural="
                  (progressStore.hideoutLevels?.[props.station.id]?.self || 0) - 1
                "
              >
                <template #level>
                  {{
                    (progressStore.hideoutLevels?.[props.station.id]?.self || 0) -
                    1
                  }}
                </template>
              </i18n-t>
            </UButton>
          </div>
        </div>
        <div
          v-if="upgradeDisabled"
          class="flex items-center justify-center flex-wrap"
        >
          <div v-if="currentLevel && !downgradeDisabled" class="mx-1 my-1">
            <UButton
              color="red"
              variant="soft"
              size="sm"
              class="my-1"
              @click="downgradeStation()"
            >
              <i18n-t
                keypath="page.hideout.stationcard.downgradebutton"
                scope="global"
                :plural="
                  (progressStore.hideoutLevels?.[props.station.id]?.self || 0) - 1
                "
              >
                <template #level>
                  {{
                    (progressStore.hideoutLevels?.[props.station.id]?.self || 0) -
                    1
                  }}
                </template>
              </i18n-t>
            </UButton>
          </div>
          <div
            v-if="nextLevel && (!currentLevel || downgradeDisabled)"
            class="mx-1 my-1"
          >
            <span class="mx-3 text-sm text-gray-400">
              {{ t("page.hideout.stationcard.upgradeunavailable") }}
            </span>
          </div>
        </div>
      </div>
    </template>
  </GenericCard>
</template>

<script setup>
import { computed, defineAsyncComponent } from "vue";
import { useProgressStore } from "@/stores/progress";
import {
  STASH_STATION_ID,
  CULTIST_CIRCLE_STATION_ID,
  UNHEARD_EDITION_IDS,
} from "@/utils/constants";
import { useTarkovStore } from "@/stores/tarkov";
import { useI18n } from "vue-i18n";

const GenericCard = defineAsyncComponent(() =>
  import("@/components/ui/GenericCard.vue")
);

const props = defineProps({
  station: {
    type: Object,
    required: true,
  },
});

const progressStore = useProgressStore();
const tarkovStore = useTarkovStore();
const { t } = useI18n({ useScope: "global" });
const toast = useToast();

const getHighlightColor = () => {
  if (progressStore.hideoutLevels?.[props.station.id]?.self > 0) {
    return "secondary";
  } else {
    return "green";
  }
};

const getSubtitleText = computed(() => {
  if (upgradeDisabled.value) {
    return "";
  }
  return undefined; // Let the template handle the level display
});

const upgradeDisabled = computed(() => {
  return nextLevel.value === null;
});

const downgradeDisabled = computed(() => {
  if (props.station.id === STASH_STATION_ID) {
    const currentStash =
      progressStore.hideoutLevels?.[props.station.id]?.self ?? 0;
    const editionId = tarkovStore.getGameEdition();
    const editionData = progressStore.gameEditionData.find(
      (e) => e.version === editionId
    );
    const defaultStash = editionData?.defaultStashLevel ?? 0;
    return currentStash <= defaultStash;
  }
  if (props.station.id === CULTIST_CIRCLE_STATION_ID) {
    const editionId = tarkovStore.getGameEdition();
    // If Unheard Edition (5) or Unheard+EOD Edition (6), disable downgrade
    return UNHEARD_EDITION_IDS.includes(editionId);
  }
  return false;
});

const upgradeStation = () => {
  // Store next level to a variable because it can change mid-function
  const upgradeLevel = nextLevel.value;
  tarkovStore.setHideoutModuleComplete(upgradeLevel.id);
  // For each objective, mark it as complete
  upgradeLevel.itemRequirements.forEach((o) => {
    tarkovStore.setHideoutPartComplete(o.id);
  });
  toast.add({
    title: t("page.hideout.stationcard.statusupgraded", {
      name: props.station.name,
      level: upgradeLevel.level,
    }),
    color: "green",
  });
};

const downgradeStation = () => {
  // Store current level to a variable because it can change mid-function
  const downgradeLevel = currentLevel.value;
  tarkovStore.setHideoutModuleUncomplete(downgradeLevel.id);
  // For each objective, mark it as incomplete
  downgradeLevel.itemRequirements.forEach((o) => {
    tarkovStore.setHideoutPartUncomplete(o.id);
  });
  toast.add({
    title: t("page.hideout.stationcard.statusdowngraded", {
      name: props.station.name,
      level: downgradeLevel.level,
    }),
    color: "red",
  });
};

const nextLevel = computed(() => {
  return (
    props.station.levels.find(
      (level) =>
        level.level ===
        (progressStore.hideoutLevels?.[props.station.id]?.self || 0) + 1
    ) || null
  );
});

const currentLevel = computed(() => {
  return (
    props.station.levels.find(
      (level) =>
        level.level === progressStore.hideoutLevels?.[props.station.id]?.self
    ) || null
  );
});

const stationAvatar = computed(() => {
  return `/img/hideout/${props.station.id}.avif`;
});

const getStashAdjustedDescription = (description) => {
  // Only modify description for stash station
  if (props.station.id !== STASH_STATION_ID) {
    return description;
  }
  // Check if user has Unheard Edition (5) or Unheard + EOD Edition (6)
  const editionId = tarkovStore.getGameEdition();
  const isUnheardEdition = UNHEARD_EDITION_IDS.includes(editionId);
  // For Unheard editions, show static description with 10x72
  if (isUnheardEdition) {
    return "Maximum size stash (10x72)";
  }
  return description;
};
</script>