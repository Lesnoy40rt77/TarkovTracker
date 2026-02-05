<template>
  <UApp>
    <!-- Loading Screen (shows while initial data is loading) -->
    <LoadingScreen />
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <!-- Portal target for modals -->
    <div id="modals"></div>
  </UApp>
</template>
<script setup lang="ts">
  import { useAppInitialization } from '@/composables/useAppInitialization';
  useAppInitialization();
  const route = useRoute();
  const { locale } = useI18n();
  const { public: publicConfig } = useRuntimeConfig();
  const siteUrl = (publicConfig.appUrl || 'https://tarkovtracker.org').replace(/\/$/, '');
  const webApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'TarkovTracker',
    url: siteUrl,
    applicationCategory: 'GameApplication',
    operatingSystem: 'Web',
    description:
      'Complete Escape from Tarkov progress tracker for patch 1.0+. Track quests, storyline, hideout, and needed items.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    author: {
      '@type': 'Organization',
      name: 'TarkovTracker',
      url: siteUrl,
    },
    sameAs: ['https://github.com/tarkovtracker-org/TarkovTracker'],
  };
  useHead(() => ({
    htmlAttrs: {
      lang: locale.value,
    },
    link: [
      {
        rel: 'canonical',
        href: `${siteUrl}${route.path}`,
      },
    ],
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify(webApplicationSchema),
      },
    ],
  }));
  useSeoMeta({
    ogUrl: computed(() => `${siteUrl}${route.path}`),
    ogLocale: computed(() => locale.value),
  });
</script>
