<template>
  <div class="block">
    <template v-if="!isComplete && !isLocked">
      <ActionButton
        :xs="xs"
        color="success"
        icon="mdi-check-all"
        :text="t('page.tasks.questcard.complete_button').toUpperCase()"
        :ui="completeButtonUi"
        @click="$emit('complete')"
      />
      <AlternativesList
        v-if="task.alternatives?.length"
        :alternatives="task.alternatives"
        :tasks="tasks"
      />
    </template>
    <template v-else-if="isComplete">
      <ActionButton
        :xs="xs"
        color="accent"
        icon="mdi-undo"
        :text="t('page.tasks.questcard.uncomplete_button')"
        @click="$emit('uncomplete')"
      />
      <AlternativesList
        v-if="task.alternatives?.length"
        :alternatives="task.alternatives"
        :tasks="tasks"
        :label="t('page.tasks.questcard.alternative_failed')"
      />
    </template>
    <template v-else-if="!isOurFaction">
      {{ t('page.tasks.questcard.different_faction') }}
    </template>
    <template v-else-if="isLocked">
      <div :class="xs ? 'flex justify-center' : ''">
        <ActionButton
          :xs="xs"
          color="accent"
          icon="mdi-fast-forward"
          :text="t('page.tasks.questcard.available_button')"
          :size="xs ? 'small' : 'x-large'"
          class="mx-1 my-1"
          @click="$emit('unlock')"
        />
        <ActionButton
          :xs="xs"
          color="success"
          icon="mdi-check-all"
          :text="t('page.tasks.questcard.complete_button').toUpperCase()"
          :ui="completeButtonUi"
          :size="xs ? 'small' : 'x-large'"
          class="mx-1 my-1"
          @click="$emit('complete')"
        />
      </div>
    </template>
    <!-- Experience rewards -->
    <div
      v-if="preferencesStore.getShowExperienceRewards && task.experience"
      class="text-surface-400 mt-2 flex items-center justify-end gap-1 text-sm"
    >
      <UIcon name="i-mdi-star" class="text-warning-500 h-4 w-4" />
      <span>{{ formatNumber(task.experience) }} XP</span>
    </div>
  </div>
</template>
<script setup lang="ts">
  import { useI18n } from 'vue-i18n';
  import { usePreferencesStore } from '@/stores/usePreferences';
  import { useLocaleNumberFormatter } from '@/utils/formatters';
  import type { Task } from '@/types/tarkov';
  const ActionButton = defineAsyncComponent(() => import('@/features/tasks/ActionButton.vue'));
  const AlternativesList = defineAsyncComponent(
    () => import('@/features/tasks/AlternativesList.vue')
  );
  const { t } = useI18n({ useScope: 'global' });
  const preferencesStore = usePreferencesStore();
  const formatNumber = useLocaleNumberFormatter();
  const completeButtonUi = {
    base: 'bg-success-500 hover:bg-success-600 active:bg-success-700 text-white border border-success-700',
  };
  defineProps<{
    task: Task;
    tasks: Task[];
    xs: boolean;
    isComplete: boolean;
    isLocked: boolean;
    isOurFaction: boolean;
  }>();
  defineEmits<{
    complete: [];
    uncomplete: [];
    unlock: [];
  }>();
</script>
