<template>
  <div class="w-full space-y-4">
    <div class="flex items-center justify-center py-2">
      <UIcon name="i-mdi-loading" class="text-surface-400 mr-2 h-5 w-5 animate-spin" />
      <span class="text-surface-400 text-sm">{{ t('page.tasks.loading') }}</span>
    </div>
    <div class="space-y-4">
      <div
        v-for="i in 3"
        :key="i"
        class="bg-surface-800 animate-pulse rounded-lg border border-white/10 p-4"
      >
        <div class="flex items-center gap-3">
          <div class="bg-surface-700 h-9 w-9 rounded-full"></div>
          <div class="flex-1 space-y-2">
            <div class="bg-surface-700 h-4 w-3/4 rounded"></div>
            <div class="bg-surface-700 h-3 w-1/2 rounded"></div>
          </div>
        </div>
        <div class="mt-4 space-y-2">
          <div class="bg-surface-700 h-3 w-full rounded"></div>
          <div class="bg-surface-700 h-3 w-5/6 rounded"></div>
        </div>
      </div>
    </div>
    <div class="flex justify-center">
      <refresh-button />
    </div>
  </div>
</template>
<script setup lang="ts">
  import { useI18n } from 'vue-i18n';
  import RefreshButton from '@/components/ui/RefreshButton.vue';
  const { t } = useI18n({ useScope: 'global' });
</script>
