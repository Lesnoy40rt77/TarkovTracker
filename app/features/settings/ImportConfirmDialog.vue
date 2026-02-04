<template>
  <UModal
    :open="props.show"
    :ui="{ content: 'bg-transparent border-0 p-0 shadow-none ring-0 outline-none' }"
    @update:open="$emit('update:show', $event)"
  >
    <template #content>
      <UCard>
        <template #header>
          <div class="px-4 py-3 text-xl font-medium">{{ t('importConfirm.title') }}</div>
        </template>
        <div class="px-4 pb-4">
          <p class="mb-3">{{ t('importConfirm.description') }}</p>
          <div class="bg-surface-800 mb-4 rounded-lg p-3">
            <div class="flex items-center">
              <UIcon name="i-mdi-sword-cross" class="mr-2 h-4 w-4" />
              <span class="font-medium">{{ t('importConfirm.targetMode') }}</span>
            </div>
            <UAlert
              icon="i-mdi-information"
              color="primary"
              variant="soft"
              class="mt-3 mb-0"
              :title="t('importConfirm.notice')"
            />
          </div>
          <p class="mb-4">{{ t('importConfirm.listTitle') }}</p>
          <DataPreviewCard
            :data="data"
            :completed-tasks="completedTasks"
            :failed-tasks="failedTasks"
            :task-objectives="taskObjectives"
            :hideout-modules="hideoutModules"
            :hideout-parts="hideoutParts"
            @show-objectives-details="$emit('show-objectives-details')"
            @show-failed-tasks-details="$emit('show-failed-tasks-details')"
          />
          <p class="text-error-500 mt-5 font-bold">{{ t('importConfirm.warning') }}</p>
        </div>
        <template #footer>
          <div class="flex justify-end px-4 pb-4">
            <UButton color="neutral" variant="solid" class="px-4" @click="$emit('cancel')">
              {{ t('common.cancel') }}
            </UButton>
            <UButton
              color="error"
              variant="solid"
              :loading="importing"
              class="ml-3 px-4"
              @click="$emit('confirm')"
            >
              {{ t('importConfirm.confirm') }}
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
<script setup lang="ts">
  import { useI18n } from 'vue-i18n';
  const { t } = useI18n({ useScope: 'global' });
  const props = defineProps({
    show: {
      type: Boolean,
      default: false,
    },
    data: {
      type: Object,
      default: null,
    },
    completedTasks: {
      type: Number,
      default: 0,
    },
    failedTasks: {
      type: Number,
      default: 0,
    },
    taskObjectives: {
      type: Number,
      default: 0,
    },
    hideoutModules: {
      type: Number,
      default: 0,
    },
    hideoutParts: {
      type: Number,
      default: 0,
    },
    importing: {
      type: Boolean,
      default: false,
    },
  });
  defineEmits([
    'cancel',
    'confirm',
    'show-objectives-details',
    'show-failed-tasks-details',
    'update:show',
  ]);
</script>
