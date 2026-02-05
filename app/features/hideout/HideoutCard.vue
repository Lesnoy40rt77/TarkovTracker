<template>
  <GenericCard
    :id="stationAnchorId"
    :avatar="stationAvatar"
    :highlight-color="getHighlightColor()"
    :avatar-height="50"
    :fill-height="false"
    :show-divider="false"
    class="relative rounded-lg"
    :class="cardHighlightClasses"
    header-classes="pb-2"
    @mouseenter="scheduleDismissHighlight"
    @focusin="scheduleDismissHighlight"
    @mouseleave="cancelDismissHighlightDebounce"
    @focusout="cancelDismissHighlightDebounce"
  >
    <template #header>
      <div class="flex items-center justify-between pb-2 text-xl">
        <div class="flex items-center gap-3">
          <span :class="highlightClasses" class="inline-block rounded-br-lg px-3 py-1 shadow-lg">
            <img :src="stationAvatar" :alt="station.name" class="block h-12 pt-0" />
          </span>
          <div class="flex items-center gap-2">
            <span class="inline-block text-left leading-6">
              {{ station.name }}
            </span>
            <div
              v-if="!upgradeDisabled"
              class="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs leading-none font-semibold"
              :class="
                prerequisitesMet
                  ? 'bg-success-500/20 border-success-500/50 text-success-400'
                  : 'border-error-500/50 bg-error-500/20 text-error-400'
              "
            >
              <span class="whitespace-nowrap">
                <template v-if="prerequisitesMet">
                  <i18n-t
                    keypath="page.hideout.stationcard.level"
                    scope="global"
                    :plural="progressStore.hideoutLevels?.[props.station.id]?.self || 0"
                  >
                    <template #level>
                      {{ progressStore.hideoutLevels?.[props.station.id]?.self || 0 }}
                    </template>
                  </i18n-t>
                </template>
                <template v-else>
                  {{ $t('page.hideout.stationcard.level_not_ready') }}
                </template>
              </span>
            </div>
            <div
              v-if="highlightedLevel"
              class="border-primary-500/60 bg-primary-500/10 text-primary-200 inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold"
            >
              <UIcon name="i-mdi-link-variant" class="h-3.5 w-3.5" />
              <i18n-t
                keypath="page.hideout.stationcard.level"
                scope="global"
                :plural="highlightedLevel.level"
              >
                <template #level>{{ highlightedLevel.level }}</template>
              </i18n-t>
            </div>
          </div>
        </div>
        <UButton
          :icon="isContentVisible ? 'i-mdi-chevron-up' : 'i-mdi-chevron-down'"
          :aria-label="
            isContentVisible ? $t('hideout.collapse', 'Collapse') : $t('hideout.expand', 'Expand')
          "
          color="neutral"
          variant="ghost"
          size="sm"
          class="mr-2"
          @click="isContentVisible = !isContentVisible"
        />
      </div>
    </template>
    <template #content>
      <div v-if="isContentVisible">
        <div
          v-if="props.station.normalizedName === SPECIAL_STATIONS.STASH"
          class="bg-surface-700 mb-3 rounded-lg p-3 text-center"
        >
          <div class="mb-2 text-sm">
            {{ $t('page.hideout.stationcard.game_edition_description') }}
          </div>
          <UButton variant="soft" to="/settings" color="neutral">
            {{ $t('page.hideout.stationcard.settings_button') }}
          </UButton>
        </div>
        <div v-if="nextLevel" class="space-y-3">
          <div
            v-if="hasItemRequirements"
            class="bg-surface-800 relative rounded-lg p-3"
            :class="moduleHighlightClasses"
          >
            <div class="mb-3 flex items-center text-base font-medium">
              <UIcon
                name="i-mdi-package-variant-closed-check"
                class="text-success-500 mr-2 h-5 w-5"
              />
              {{ $t('page.hideout.stationcard.next_level') }}
            </div>
            <div class="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              <HideoutRequirement
                v-for="requirement in nextLevel.itemRequirements"
                :key="requirement.id"
                :requirement="requirement"
                :station-id="props.station.id"
                :level="nextLevel.level"
              />
            </div>
            <div v-if="hasPrerequisites" class="border-surface-700 space-y-2 border-t pt-3">
              <div class="text-surface-400 mb-2 text-xs font-medium tracking-wider uppercase">
                {{ $t('page.hideout.stationcard.prerequisites') || 'Prerequisites' }}
              </div>
              <div
                v-for="(requirement, rIndex) in nextLevel.stationLevelRequirements"
                :key="`station-${rIndex}`"
                class="flex items-center gap-2 text-sm"
                :class="
                  isStationReqMet(requirement) ? 'text-surface-300' : 'text-error-400 font-semibold'
                "
              >
                <UIcon
                  name="i-mdi-home"
                  class="h-4 w-4"
                  :class="isStationReqMet(requirement) ? 'text-info-500' : 'text-error-500'"
                />
                <i18n-t keypath="page.hideout.stationcard.requirements.station" scope="global">
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
                :key="`skill-${rIndex}`"
                class="flex items-center gap-2 text-sm"
                :class="
                  isSkillReqMet(requirement) ? 'text-surface-300' : 'text-error-400 font-semibold'
                "
              >
                <UIcon
                  name="i-mdi-star"
                  class="h-4 w-4"
                  :class="isSkillReqMet(requirement) ? 'text-warning-500' : 'text-error-500'"
                />
                <i18n-t keypath="page.hideout.stationcard.requirements.skill" scope="global">
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
                :key="`trader-${rIndex}`"
                class="flex items-center gap-2 text-sm"
                :class="
                  isTraderReqMet(requirement) ? 'text-surface-300' : 'text-error-400 font-semibold'
                "
              >
                <UIcon
                  name="i-mdi-account-tie"
                  class="h-4 w-4"
                  :class="isTraderReqMet(requirement) ? 'text-secondary-500' : 'text-error-500'"
                />
                <i18n-t keypath="page.hideout.stationcard.requirements.trader" scope="global">
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
        </div>
        <div v-if="!nextLevel" class="bg-surface-800 rounded p-3">
          <div
            class="text-warning-500 flex items-center justify-center text-center text-base font-medium"
          >
            <UIcon name="i-mdi-star-check" class="mr-2 h-6 w-6" />
            {{ $t('page.hideout.stationcard.max_level') }}
          </div>
        </div>
      </div>
    </template>
    <template #footer>
      <div v-if="isContentVisible" class="p-2">
        <div v-if="!upgradeDisabled" class="flex flex-col gap-2">
          <UButton
            v-if="nextLevel?.level"
            color="success"
            variant="solid"
            size="lg"
            block
            :ui="upgradeButtonUi"
            @click="upgradeStation()"
          >
            <i18n-t
              keypath="page.hideout.stationcard.upgrade_button"
              scope="global"
              :plural="nextLevel?.level"
            >
              <template #level>
                {{ nextLevel?.level }}
              </template>
            </i18n-t>
          </UButton>
          <UButton
            v-if="currentLevel && !downgradeDisabled"
            size="sm"
            block
            :ui="downgradeButtonUi"
            @click="downgradeStation()"
          >
            <i18n-t
              keypath="page.hideout.stationcard.downgrade_button"
              scope="global"
              :plural="(progressStore.hideoutLevels?.[props.station.id]?.self || 0) - 1"
            >
              <template #level>
                {{ (progressStore.hideoutLevels?.[props.station.id]?.self || 0) - 1 }}
              </template>
            </i18n-t>
          </UButton>
        </div>
        <div v-if="upgradeDisabled" class="flex flex-wrap items-center justify-center gap-2">
          <UButton
            v-if="currentLevel && !downgradeDisabled"
            size="sm"
            :ui="downgradeButtonUi"
            @click="downgradeStation()"
          >
            <i18n-t
              keypath="page.hideout.stationcard.downgrade_button"
              scope="global"
              :plural="(progressStore.hideoutLevels?.[props.station.id]?.self || 0) - 1"
            >
              <template #level>
                {{ (progressStore.hideoutLevels?.[props.station.id]?.self || 0) - 1 }}
              </template>
            </i18n-t>
          </UButton>
          <span
            v-if="nextLevel && (!currentLevel || downgradeDisabled)"
            class="text-surface-400 text-sm"
          >
            {{ t('page.hideout.stationcard.upgrade_unavailable') }}
          </span>
        </div>
      </div>
    </template>
  </GenericCard>
</template>
<script setup lang="ts">
  import { useI18n } from 'vue-i18n';
  import { useProgressStore } from '@/stores/useProgress';
  import { useTarkovStore } from '@/stores/useTarkov';
  import { SPECIAL_STATIONS } from '@/utils/constants';
  import type { HideoutLevel, HideoutStation, ItemRequirement } from '@/types/tarkov';
  const GenericCard = defineAsyncComponent(() => import('@/components/ui/GenericCard.vue'));
  const HideoutRequirement = defineAsyncComponent(
    () => import('@/features/hideout/HideoutRequirement.vue')
  );
  const props = withDefaults(
    defineProps<{
      station: HideoutStation;
      collapsed?: boolean;
      highlighted?: boolean;
      highlightModuleId?: string | null;
    }>(),
    {
      collapsed: false,
      highlighted: false,
      highlightModuleId: null,
    }
  );
  const progressStore = useProgressStore();
  const tarkovStore = useTarkovStore();
  const { arePrereqsMet, isSkillReqMet, isStationReqMet, isTraderReqMet } =
    useHideoutStationStatus();
  const { t } = useI18n({ useScope: 'global' });
  const toast = useToast();
  const isContentVisible = ref(!props.collapsed);
  const highlightDismissed = ref(false);
  watch(
    () => props.collapsed,
    (newValue) => {
      if (highlightActive.value) {
        isContentVisible.value = true;
        return;
      }
      isContentVisible.value = !newValue;
    }
  );
  watch(
    () => [props.highlighted, props.highlightModuleId],
    ([highlighted, highlightModuleId]) => {
      if (highlighted || highlightModuleId) {
        highlightDismissed.value = false;
        isContentVisible.value = true;
      }
    },
    { immediate: true }
  );
  const stationAnchorId = computed(() => `station-${props.station.id}`);
  const upgradeButtonUi = {
    base: 'bg-success-500 hover:bg-success-600 active:bg-success-700 text-white border border-success-700',
  };
  const downgradeButtonUi = {
    base: 'bg-error-900/40 hover:bg-error-900/60 active:bg-error-900/80 text-error-300 border border-error-700/50',
  };
  const getHighlightColor = (): 'success' | 'error' | 'primary' => {
    if (!nextLevel.value) return 'primary';
    return prerequisitesMet.value ? 'success' : 'error';
  };
  const highlightClasses = computed(() => {
    const color = getHighlightColor();
    const classes: Record<string, boolean> = {};
    switch (color) {
      case 'primary':
        classes['bg-gradient-to-br from-primary-800 via-primary-700 to-primary-600'] = true;
        break;
      case 'success':
        classes['bg-gradient-to-br from-success-800 via-success-700 to-success-600'] = true;
        break;
      case 'error':
        classes['bg-gradient-to-br from-error-800 via-error-700 to-error-600'] = true;
        break;
      default:
        classes['bg-gradient-to-br from-accent-800 via-accent-700 to-accent-600'] = true;
        break;
    }
    return classes;
  });
  const prerequisitesMet = computed(() => {
    if (!nextLevel.value) return true;
    return arePrereqsMet(nextLevel.value);
  });
  const upgradeDisabled = computed(() => {
    return nextLevel.value === null;
  });
  const downgradeDisabled = computed(() => {
    if (props.station.normalizedName === SPECIAL_STATIONS.STASH) {
      const currentStash = progressStore.hideoutLevels?.[props.station.id]?.self ?? 0;
      const editionId = tarkovStore.getGameEdition();
      const editionData = progressStore.gameEditionData.find((e) => e.value === editionId);
      const defaultStash = editionData?.defaultStashLevel ?? 0;
      return currentStash <= defaultStash;
    }
    if (props.station.normalizedName === SPECIAL_STATIONS.CULTIST_CIRCLE) {
      const currentLevel = progressStore.hideoutLevels?.[props.station.id]?.self ?? 0;
      const editionId = tarkovStore.getGameEdition();
      const editionData = progressStore.gameEditionData.find((e) => e.value === editionId);
      const defaultCultistCircle = editionData?.defaultCultistCircleLevel ?? 0;
      return currentLevel <= defaultCultistCircle;
    }
    return false;
  });
  const nextLevel = computed<HideoutLevel | null>(() => {
    return (
      props.station.levels.find(
        (level: HideoutLevel) =>
          level.level === (progressStore.hideoutLevels?.[props.station.id]?.self || 0) + 1
      ) || null
    );
  });
  const currentLevel = computed<HideoutLevel | null>(() => {
    return (
      props.station.levels.find(
        (level: HideoutLevel) =>
          level.level === progressStore.hideoutLevels?.[props.station.id]?.self
      ) || null
    );
  });
  const hasItemRequirements = computed(() => {
    return (nextLevel.value?.itemRequirements?.length || 0) > 0;
  });
  const hasPrerequisites = computed(() => {
    return (
      (nextLevel.value?.stationLevelRequirements?.length ?? 0) > 0 ||
      (nextLevel.value?.skillRequirements?.length ?? 0) > 0 ||
      (nextLevel.value?.traderRequirements?.length ?? 0) > 0
    );
  });
  const stationAvatar = computed(() => props.station.imageLink);
  const highlightedLevel = computed(() => {
    if (!props.highlightModuleId) return null;
    return props.station.levels.find((level) => level.id === props.highlightModuleId) || null;
  });
  const highlightActive = computed(() => {
    return (props.highlighted || highlightedLevel.value) && !highlightDismissed.value;
  });
  const highlightMatchesNext = computed(() => {
    if (!highlightedLevel.value || !nextLevel.value) return false;
    return highlightedLevel.value.id === nextLevel.value.id;
  });
  const highlightTargetsModule = computed(() => {
    return highlightMatchesNext.value && hasItemRequirements.value;
  });
  const HIGHLIGHT_BASE_CLASSES =
    'after:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:ring-2 after:ring-primary-400/70 after:ring-offset-2 after:content-[""] after:animate-pulse';
  const buildHighlightClasses = (offsetClass: string) => {
    return `${HIGHLIGHT_BASE_CLASSES} ${offsetClass}`;
  };
  const cardHighlightClasses = computed(() => {
    if (!highlightActive.value || highlightTargetsModule.value) return '';
    return buildHighlightClasses('after:ring-offset-surface-900');
  });
  const moduleHighlightClasses = computed(() => {
    if (!highlightActive.value || !highlightTargetsModule.value) return '';
    return buildHighlightClasses('after:ring-offset-surface-800');
  });
  const HIGHLIGHT_DISMISS_DELAY_MS = 200;
  let dismissHighlightTimer: ReturnType<typeof setTimeout> | null = null;
  const clearDismissHighlightTimer = () => {
    if (!dismissHighlightTimer) return;
    clearTimeout(dismissHighlightTimer);
    dismissHighlightTimer = null;
  };
  const dismissHighlight = () => {
    if (!highlightActive.value) return;
    highlightDismissed.value = true;
  };
  const scheduleDismissHighlight = () => {
    clearDismissHighlightTimer();
    dismissHighlightTimer = setTimeout(() => {
      dismissHighlightTimer = null;
      dismissHighlight();
    }, HIGHLIGHT_DISMISS_DELAY_MS);
  };
  const cancelDismissHighlightDebounce = () => {
    clearDismissHighlightTimer();
  };
  const upgradeStation = () => {
    // Store next level to a variable because it can change mid-function
    const upgradeLevel = nextLevel.value;
    if (!upgradeLevel) return;
    tarkovStore.setHideoutModuleComplete(upgradeLevel.id);
    // For each objective, mark it as complete
    upgradeLevel.itemRequirements.forEach((o: ItemRequirement) => {
      tarkovStore.setHideoutPartComplete(o.id);
    });
    toast.add({
      title: t('page.hideout.stationcard.status_upgraded', {
        name: props.station.name,
        level: upgradeLevel.level,
      }),
      color: 'success',
    });
  };
  const downgradeStation = () => {
    // Store current level to a variable because it can change mid-function
    const downgradeLevel = currentLevel.value;
    if (!downgradeLevel) return;
    tarkovStore.setHideoutModuleUncomplete(downgradeLevel.id);
    // For each objective, mark it as incomplete
    downgradeLevel.itemRequirements.forEach((o: ItemRequirement) => {
      tarkovStore.setHideoutPartUncomplete(o.id);
    });
    toast.add({
      title: t('page.hideout.stationcard.status_downgraded', {
        name: props.station.name,
        level: downgradeLevel.level,
      }),
      color: 'error',
    });
  };
  onUnmounted(() => {
    clearDismissHighlightTimer();
  });
</script>
