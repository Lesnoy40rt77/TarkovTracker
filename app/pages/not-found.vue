<template>
  <div class="flex h-52 items-center justify-center text-center">
    <UCard
      class="text-surface-50 w-full max-w-xl border border-white/10 bg-transparent"
      :ui="{ body: 'p-6' }"
    >
      {{ $t('page.not_found.not_found_description') }}
    </UCard>
  </div>
</template>
<script setup lang="ts">
  import { useI18n } from 'vue-i18n';
  const { t } = useI18n({ useScope: 'global' });
  useSeoMeta({
    title: t('page.not_found.title', 'Not Found'),
    robots: 'noindex, nofollow',
  });
</script>
