<template>
  <div class="flex items-center justify-center px-3 py-2">
    <template v-if="isCollapsed">
      <div class="text-center">
        <div class="text-surface-400 mb-1 text-[0.7em]">
          {{ t('navigation_drawer.level') }}
        </div>
        <h1 class="text-center text-2xl leading-tight font-bold">
          {{ displayedLevel }}
        </h1>
      </div>
    </template>
    <template v-else>
      <div class="w-full">
        <div class="flex min-w-0 items-center gap-2.5 rounded-md bg-white/5 px-2.5 py-2">
          <span class="shrink-0 leading-none">
            <div class="relative h-11 w-11 overflow-hidden">
              <template v-if="isDataReady && groupIcon">
                <NuxtImg
                  v-if="!groupImageLoadFailed"
                  :src="groupIcon"
                  class="max-w-11"
                  width="44"
                  height="44"
                  @error="handleGroupImageError"
                />
                <div v-else class="flex h-11 w-11 items-center justify-center rounded bg-white/5">
                  <UIcon name="i-heroicons-photo" class="text-surface-600 h-5 w-5" />
                </div>
              </template>
              <template v-else>
                <div class="flex h-11 w-11 items-center justify-center rounded bg-white/5">
                  <UIcon
                    name="i-heroicons-arrow-path"
                    class="text-surface-500 h-5 w-5 animate-spin"
                  />
                </div>
              </template>
            </div>
          </span>
          <span class="min-w-0 flex-1">
            <div
              class="text-surface-400 mb-0.5 flex items-center justify-center gap-1 text-[0.6rem]"
            >
              <span>{{ t('navigation_drawer.level') }}</span>
              <span class="text-surface-500 text-[0.5rem]">·</span>
              <span
                class="text-[0.55rem]"
                :class="useAutomaticLevel ? 'text-accent-400' : 'text-surface-500'"
              >
                {{
                  useAutomaticLevel
                    ? t('navigation_drawer.mode_auto', 'Auto')
                    : t('navigation_drawer.mode_manual', 'Manual')
                }}
              </span>
            </div>
            <div class="flex h-8 items-center justify-center text-center">
              <AppTooltip
                v-if="!editingLevel || useAutomaticLevel"
                :text="
                  useAutomaticLevel
                    ? t(
                        'navigation_drawer.auto_level_enabled',
                        'Automatic level calculation is enabled'
                      )
                    : ''
                "
              >
                <h1
                  :class="
                    useAutomaticLevel
                      ? 'mx-auto block h-8 w-12 text-center text-3xl leading-8 font-bold'
                      : 'hover:text-primary mx-auto block h-8 w-12 cursor-pointer text-center text-3xl leading-8 font-bold transition-colors'
                  "
                  :tabindex="useAutomaticLevel ? '-1' : '0'"
                  :role="useAutomaticLevel ? undefined : 'button'"
                  :aria-disabled="useAutomaticLevel ? 'true' : undefined"
                  :aria-label="
                    useAutomaticLevel
                      ? t(
                          'navigation_drawer.level_display_auto',
                          { level: displayedLevel },
                          'Level {level} (automatic calculation enabled)'
                        )
                      : t(
                          'navigation_drawer.level_display_editable',
                          { level: displayedLevel },
                          'Level {level}, click or press Enter to edit'
                        )
                  "
                  @click="!useAutomaticLevel && startEditingLevel()"
                  @keydown.enter="!useAutomaticLevel && startEditingLevel()"
                  @keydown.space.prevent="!useAutomaticLevel && startEditingLevel()"
                >
                  {{ displayedLevel }}
                </h1>
              </AppTooltip>
              <input
                v-else
                ref="levelInput"
                v-model.number="levelInputValue"
                type="number"
                :min="minPlayerLevel"
                :max="maxPlayerLevel"
                class="no-spinner mx-auto block h-8 w-12 border-0 bg-transparent p-0 text-center text-3xl leading-8 font-bold outline-none focus:ring-0"
                @input="enforceMaxLevel"
                @blur="saveLevel"
                @keyup.enter="saveLevel"
              />
            </div>
          </span>
          <span
            v-if="!useAutomaticLevel"
            class="flex shrink-0 flex-col overflow-hidden rounded-md border border-white/10 bg-white/5"
          >
            <button
              :class="[STEPPER_BUTTON_CLASS, 'border-b border-white/10']"
              :disabled="displayedLevel >= maxPlayerLevel"
              :aria-label="t('navigation_drawer.increment_level', 'Increase level')"
              @click="incrementLevel"
            >
              <UIcon name="i-heroicons-plus" class="h-3.5 w-3.5" />
            </button>
            <button
              :class="STEPPER_BUTTON_CLASS"
              :disabled="displayedLevel <= minPlayerLevel"
              :aria-label="t('navigation_drawer.decrement_level', 'Decrease level')"
              @click="decrementLevel"
            >
              <UIcon name="i-heroicons-minus" class="h-3.5 w-3.5" />
            </button>
          </span>
        </div>
        <div
          v-if="useAutomaticLevel"
          class="hover:border-surface-600 mt-1.5 cursor-pointer rounded border border-white/5 bg-white/2 px-2 py-1 transition-all hover:bg-white/4"
          @click="navigateToSettings"
        >
          <div class="mb-0.5 flex items-center justify-between text-[0.6rem]">
            <span class="text-surface-400">{{ formatNumber(xpCalculation.totalXP.value) }} XP</span>
            <span class="text-surface-500">
              {{ formatNumber(xpCalculation.xpToNextLevel.value) }} needed
            </span>
          </div>
          <div class="bg-surface-800/35 h-2 overflow-hidden rounded-full">
            <div
              class="bg-primary-500/60 h-full rounded-full transition-[width] duration-300 ease-out"
              :style="{ width: `${xpCalculation.xpProgress.value}%` }"
            ></div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
<script setup>
  import { useI18n } from 'vue-i18n';
  import { useRouter } from 'vue-router';
  import { useXpCalculation } from '@/composables/useXpCalculation';
  import { useMetadataStore } from '@/stores/useMetadata';
  import { usePreferencesStore } from '@/stores/usePreferences';
  import { useTarkovStore } from '@/stores/useTarkov';
  import { useLocaleNumberFormatter } from '@/utils/formatters';
  import { logger } from '@/utils/logger';
  const { t } = useI18n({ useScope: 'global' });
  const router = useRouter();
  const formatNumber = useLocaleNumberFormatter();
  defineProps({
    isCollapsed: {
      type: Boolean,
      required: true,
    },
  });
  const tarkovStore = useTarkovStore();
  const metadataStore = useMetadataStore();
  const preferencesStore = usePreferencesStore();
  const xpCalculation = useXpCalculation();
  const minPlayerLevel = computed(() => metadataStore.minPlayerLevel);
  const maxPlayerLevel = computed(() => metadataStore.maxPlayerLevel);
  const playerLevels = computed(() => metadataStore.playerLevels);
  const useAutomaticLevel = computed(() => preferencesStore.getUseAutomaticLevelCalculation);
  const STEPPER_BUTTON_CLASS =
    'flex h-5.5 w-5.5 items-center justify-center p-0 text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40';
  const displayedLevel = computed(() => {
    return useAutomaticLevel.value ? xpCalculation.derivedLevel.value : tarkovStore.playerLevel();
  });
  const isDataReady = computed(() => {
    return (
      !metadataStore.loading && metadataStore.playerLevels.length > 0 && tarkovStore.getPMCFaction()
    );
  });
  const groupIcon = computed(() => {
    const level = displayedLevel.value;
    const entry = playerLevels.value.find((pl) => pl.level === level);
    return entry?.levelBadgeImageLink ?? '';
  });
  const groupImageLoadFailed = ref(false);
  const editingLevel = ref(false);
  const levelInputValue = ref(tarkovStore.playerLevel());
  const levelInput = ref(null);
  function startEditingLevel() {
    editingLevel.value = true;
    levelInputValue.value = tarkovStore.playerLevel();
    nextTick(() => {
      if (levelInput.value) levelInput.value.focus();
    });
  }
  function enforceMaxLevel() {
    const currentValue = parseInt(levelInputValue.value, 10);
    if (!isNaN(currentValue) && currentValue > maxPlayerLevel.value) {
      levelInputValue.value = maxPlayerLevel.value;
    }
  }
  function saveLevel() {
    let newLevel = parseInt(levelInputValue.value, 10);
    if (isNaN(newLevel)) newLevel = minPlayerLevel.value;
    newLevel = Math.max(minPlayerLevel.value, Math.min(maxPlayerLevel.value, newLevel));
    tarkovStore.setLevel(newLevel);
    editingLevel.value = false;
  }
  function incrementLevel() {
    if (tarkovStore.playerLevel() < maxPlayerLevel.value) {
      tarkovStore.setLevel(tarkovStore.playerLevel() + 1);
    }
  }
  function decrementLevel() {
    if (tarkovStore.playerLevel() > minPlayerLevel.value) {
      tarkovStore.setLevel(tarkovStore.playerLevel() - 1);
    }
  }
  function navigateToSettings() {
    router.push('/settings');
  }
  watch(groupIcon, () => {
    groupImageLoadFailed.value = false;
  });
  function handleGroupImageError(event) {
    logger.warn('Failed to load group image', { src: event?.target?.src });
    groupImageLoadFailed.value = true;
  }
</script>
