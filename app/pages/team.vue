<template>
  <div class="container mx-auto space-y-6 px-4 py-6">
    <div v-if="route?.query?.team && route?.query?.code" class="mx-auto max-w-6xl">
      <TeamInvite />
    </div>
    <div class="relative mx-auto max-w-6xl">
      <div class="space-y-6">
        <UAlert
          icon="i-mdi-alert"
          color="warning"
          variant="soft"
          :title="$t('page.team.warning.title')"
        >
          <template #description>
            {{ $t('page.team.warning.description') }}
          </template>
        </UAlert>
        <div class="grid gap-4 lg:grid-cols-2">
          <MyTeam />
          <TeamOptions />
        </div>
        <TeamMembers v-if="userHasTeam" />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
  import { useI18n } from 'vue-i18n';
  import { useSystemStoreWithSupabase } from '@/stores/useSystemStore';
  const { t } = useI18n({ useScope: 'global' });
  const metaTitle = computed(() => t('page.team.meta.title'));
  const metaDescription = computed(() => t('page.team.meta.description'));
  definePageMeta({
    title: 'Team',
    meta: [{ name: 'robots', content: 'noindex, nofollow' }],
  });
  useSeoMeta({
    title: metaTitle,
    description: metaDescription,
    robots: 'noindex, nofollow',
  });
  const TeamMembers = defineAsyncComponent(() => import('@/features/team/TeamMembers.vue'));
  const TeamOptions = defineAsyncComponent(() => import('@/features/team/TeamOptions.vue'));
  const MyTeam = defineAsyncComponent(() => import('@/features/team/MyTeam.vue'));
  const TeamInvite = defineAsyncComponent(() => import('@/features/team/TeamInvite.vue'));
  const { hasTeam } = useSystemStoreWithSupabase();
  const route = useRoute();
  const userHasTeam = computed(() => hasTeam());
</script>
