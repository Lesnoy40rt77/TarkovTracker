<template>
  <GenericCard
    icon="mdi-brain"
    icon-color="info"
    highlight-color="info"
    :fill-height="false"
    :title="$t('settings.skills.title', 'Skills Management')"
    title-classes="text-lg font-semibold"
  >
    <template #title-right>
      <div class="flex items-center gap-1">
        <UButton
          size="xs"
          :label="$t('settings.skills.sort.priority', 'Priority')"
          :variant="skillSortMode === 'priority' ? 'solid' : 'outline'"
          :color="skillSortMode === 'priority' ? 'primary' : 'neutral'"
          @click="setSkillSortMode('priority')"
        />
        <UButton
          size="xs"
          :label="$t('settings.skills.sort.ingame', 'In-Game')"
          :variant="skillSortMode === 'ingame' ? 'solid' : 'outline'"
          :color="skillSortMode === 'ingame' ? 'primary' : 'neutral'"
          @click="setSkillSortMode('ingame')"
        />
      </div>
    </template>
    <template #content>
      <div class="space-y-4 px-4 py-4">
        <p class="text-surface-400 text-xs">
          {{
            $t(
              'settings.skills.explanation',
              'Quest rewards are auto-calculated. Enter your total skill level (max 51) to adjust the offset.'
            )
          }}
        </p>
        <div
          v-if="allGameSkills.length > 0"
          class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          <div
            v-for="skill in visibleSkills"
            :key="skill.name"
            class="border-surface-700 rounded-lg border p-3"
          >
            <div class="mb-2 flex items-center gap-2">
              <div class="group relative shrink-0">
                <img
                  v-if="skill.imageLink"
                  :src="skill.imageLink"
                  :alt="skill.name"
                  class="relative z-10 h-10 w-10 rounded object-contain transition-transform duration-200 ease-out group-hover:z-50 group-hover:scale-[2.5] group-hover:rounded-md group-hover:shadow-xl"
                  loading="lazy"
                />
                <div
                  v-else
                  class="bg-surface-700 flex h-10 w-10 items-center justify-center rounded text-xs"
                >
                  ?
                </div>
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-1">
                  <span class="text-surface-100 truncate text-sm font-semibold">
                    {{ formatSkillName(skill.name) }}
                  </span>
                  <UTooltip
                    v-if="skill.requiredByTasks.length > 0"
                    :text="$t('skills.requiredFor', { items: skill.requiredByTasks.join(', ') })"
                  >
                    <UBadge color="warning" variant="soft" size="xs">
                      {{ $t('skills.req', 'Req') }}
                    </UBadge>
                  </UTooltip>
                  <UTooltip
                    v-if="skill.requiredLevels.length > 0"
                    :text="$t('skills.requiredLevels', { items: skill.requiredLevels.join(', ') })"
                  >
                    <UBadge color="accent" variant="soft" size="xs">
                      {{ $t('skills.lv', 'Lv') }} {{ formatRequiredLevels(skill.requiredLevels) }}
                    </UBadge>
                  </UTooltip>
                </div>
                <div class="text-surface-400 truncate text-xs">
                  <span v-if="skill.requiredByTasks.length > 0">
                    {{ $t('settings.skills.req_count', 'Req:') }} {{ skill.requiredByTasks.length }}
                  </span>
                  <span
                    v-if="skill.requiredByTasks.length > 0 && skill.rewardedByTasks.length > 0"
                    class="mx-1"
                  >
                    •
                  </span>
                  <span v-if="skill.rewardedByTasks.length > 0">
                    {{ $t('settings.skills.reward_count', 'Reward:') }}
                    {{ skill.rewardedByTasks.length }}
                  </span>
                </div>
              </div>
              <span
                class="shrink-0 text-lg font-bold"
                :class="getSkillLevel(skill.name) >= 51 ? 'text-warning-500' : 'text-primary-400'"
              >
                {{ getDisplayLevel(skill.name) }}
              </span>
            </div>
            <div class="mb-2 flex gap-3 text-xs">
              <div class="text-surface-400 flex-1">
                {{ $t('settings.skills.quest', 'Quest:') }}
                <span class="text-surface-200 font-medium">
                  {{ getQuestSkillLevel(skill.name) }}
                </span>
              </div>
              <div class="text-surface-400 flex-1">
                {{ $t('settings.skills.offset', 'Offset:') }}
                <span class="text-surface-200 font-medium">{{ getSkillOffset(skill.name) }}</span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <label :for="`skill-input-${skill.name}`" class="sr-only">
                {{ formatSkillName(skill.name) }} {{ $t('settings.skills.level', 'level') }}
              </label>
              <UInput
                :id="`skill-input-${skill.name}`"
                :model-value="getSkillLevel(skill.name)"
                type="text"
                inputmode="numeric"
                :min="0"
                placeholder="0"
                size="sm"
                class="flex-1"
                :aria-describedby="`skill-range-${skill.name}`"
                @keydown="preventInvalidInput"
                @paste="(event: ClipboardEvent) => onPaste(event, skill.name)"
                @focus="resetSkillLimitToast"
                @blur="resetSkillLimitToast"
                @update:model-value="(value) => updateSkillLevel(skill.name, value)"
              />
              <span :id="`skill-range-${skill.name}`" class="sr-only">
                {{ $t('settings.skills.validRange', 'Valid range: 0 to 51') }}
              </span>
              <UButton
                icon="i-mdi-refresh"
                size="sm"
                variant="soft"
                color="neutral"
                :disabled="getSkillOffset(skill.name) === 0"
                @click="resetOffset(skill.name)"
              />
            </div>
          </div>
        </div>
        <div v-if="hasShowAllToggle" class="flex justify-center pt-2">
          <UButton
            :label="
              showAllSkills
                ? $t('settings.skills.show_less', 'Show less')
                : $t('settings.skills.show_all', 'Show all')
            "
            variant="soft"
            color="neutral"
            @click="showAllSkills = !showAllSkills"
          />
        </div>
        <div v-if="allGameSkills.length === 0" class="text-surface-400 py-6 text-center text-sm">
          {{ $t('settings.skills.no_skills', 'No skills found in game data.') }}
        </div>
      </div>
    </template>
  </GenericCard>
</template>
<script setup lang="ts">
  import { breakpointsTailwind, useBreakpoints } from '@vueuse/core';
  import GenericCard from '@/components/ui/GenericCard.vue';
  import { useSkillCalculation } from '@/composables/useSkillCalculation';
  import { usePreferencesStore } from '@/stores/usePreferences';
  import type { SkillSortMode } from '@/utils/constants';
  const { t } = useI18n({ useScope: 'global' });
  const skillCalculation = useSkillCalculation();
  const preferencesStore = usePreferencesStore();
  const allGameSkills = computed(() => skillCalculation.allGameSkills.value);
  const showAllSkills = ref(false);
  const skillSortMode = computed(() => preferencesStore.getSkillSortMode);
  const setSkillSortMode = (mode: SkillSortMode) => {
    preferencesStore.setSkillSortMode(mode);
  };
  const toast = useToast();
  const skillLimitToastShown = ref(false);
  const breakpoints = useBreakpoints(breakpointsTailwind);
  const columnsPerRow = computed(() => {
    if (breakpoints.greaterOrEqual('xl').value) return 4;
    if (breakpoints.greaterOrEqual('lg').value) return 3;
    if (breakpoints.greaterOrEqual('sm').value) return 2;
    return 1;
  });
  const skillsWithRequirementsCount = computed(() => {
    return allGameSkills.value.filter((skill) => (skill.requiredLevels?.length ?? 0) > 0).length;
  });
  const collapsedVisibleCount = computed(() => {
    const total = allGameSkills.value.length;
    const requiredCount = skillsWithRequirementsCount.value;
    if (total === 0) return 0;
    if (requiredCount === 0) return total;
    return Math.min(total, Math.ceil(requiredCount / columnsPerRow.value) * columnsPerRow.value);
  });
  const hasShowAllToggle = computed(() => {
    return collapsedVisibleCount.value < allGameSkills.value.length;
  });
  const visibleSkills = computed(() => {
    if (showAllSkills.value) return allGameSkills.value;
    return allGameSkills.value.slice(0, collapsedVisibleCount.value);
  });
  const formatSkillName = (skillName: string): string => {
    return skillName
      .split(/(?=[A-Z])/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  const formatRequiredLevels = (levels: number[]): string => {
    if (levels.length === 0) return '';
    if (levels.length === 1) return String(levels[0]);
    return levels.join(',');
  };
  const getSkillLevel = (skillName: string) => skillCalculation.getSkillLevel(skillName);
  const getQuestSkillLevel = (skillName: string) => skillCalculation.getQuestSkillLevel(skillName);
  const getSkillOffset = (skillName: string) => skillCalculation.getSkillOffset(skillName);
  const getDisplayLevel = (skillName: string) => {
    const level = getSkillLevel(skillName);
    return level >= 51 ? t('skills.elite_level', 'ELITE Level') : level;
  };
  const updateSkillLevel = (skillName: string, value: string | number) => {
    const numValue = typeof value === 'string' ? parseInt(value, 10) : value;
    if (!isNaN(numValue) && numValue >= 0) {
      const clampedValue = Math.min(Math.max(numValue, 0), 51);
      skillCalculation.setTotalSkillLevel(skillName, clampedValue);
    }
  };
  const preventInvalidInput = (e: KeyboardEvent) => {
    if (['-', '+', 'e', '.'].includes(e.key)) {
      e.preventDefault();
      return;
    }
    if (
      [
        'Backspace',
        'Delete',
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        'Home',
        'End',
        'PageUp',
        'PageDown',
        'Tab',
        'Enter',
      ].includes(e.key) ||
      e.ctrlKey ||
      e.metaKey
    ) {
      return;
    }
    const target = e.target as HTMLInputElement;
    const currentVal = target.value;
    const selectionStart = target.selectionStart || 0;
    const selectionEnd = target.selectionEnd || 0;
    const nextValStr = currentVal.slice(0, selectionStart) + e.key + currentVal.slice(selectionEnd);
    const nextVal = parseInt(nextValStr, 10);
    const isNumeric = /^\d+$/.test(nextValStr);
    if (!isNumeric || isNaN(nextVal) || nextVal > 51) {
      e.preventDefault();
      showSkillLimitToast();
    }
  };
  const showSkillLimitToast = () => {
    if (skillLimitToastShown.value) return;
    skillLimitToastShown.value = true;
    toast.add({
      id: 'skill-limit-error',
      title: t('settings.skills.limit_exceeded', 'Limit Exceeded'),
      description: t('settings.skills.max_level', 'Maximum skill level is 51.'),
      color: 'error',
      icon: 'i-mdi-alert-circle',
    });
  };
  const resetSkillLimitToast = () => {
    skillLimitToastShown.value = false;
  };
  const onPaste = (e: ClipboardEvent, skillName: string) => {
    e.preventDefault();
    const pastedText = e.clipboardData?.getData('text');
    if (!pastedText) return;
    const numVal = parseInt(pastedText, 10);
    if (!isNaN(numVal)) {
      const clamped = Math.min(Math.max(numVal, 0), 51);
      skillCalculation.setTotalSkillLevel(skillName, clamped);
    }
  };
  const resetOffset = (skillName: string) => {
    skillCalculation.resetSkillOffset(skillName);
  };
</script>
