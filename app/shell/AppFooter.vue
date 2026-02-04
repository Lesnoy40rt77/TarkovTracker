<template>
  <footer class="bg-surface-900/60 border-surface-800/70 w-full border-t px-6 py-8">
    <div class="mx-auto flex w-full max-w-4xl flex-col items-center gap-5 text-center">
      <a
        href="https://ko-fi.com/dysektai"
        target="_blank"
        rel="noopener noreferrer"
        class="border-success-500 bg-success-600 hover:border-success-400 hover:bg-success-500 inline-flex items-center gap-2 rounded-lg border px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-black/40 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:shadow-md"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
          class="text-error-300 h-4 w-4"
        >
          <path
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          />
        </svg>
        <span>{{ t('footer.support_button') }}</span>
      </a>
      <p class="text-surface-400 text-xs italic">{{ t('footer.support_tagline') }}</p>
      <div class="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm">
        <router-link
          to="/terms-of-service"
          class="text-info-400 hover:text-info-300 transition-colors"
        >
          {{ t('footer.terms_of_service') }}
        </router-link>
        <span class="text-surface-600">·</span>
        <router-link to="/privacy" class="text-info-400 hover:text-info-300 transition-colors">
          {{ t('footer.privacy_policy') }}
        </router-link>
        <span class="text-surface-600">·</span>
        <router-link to="/credits" class="text-info-400 hover:text-info-300 transition-colors">
          {{ t('footer.credits') }}
        </router-link>
      </div>
      <div class="text-surface-500 text-center text-xs">
        <div class="text-surface-400 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <span>TarkovTracker &copy; 2020–{{ new Date().getFullYear() }}</span>
          <span class="text-surface-600">·</span>
          <span class="text-surface-600 font-mono">v{{ tarkovVersion }}</span>
        </div>
        <p class="text-surface-600 mt-1">{{ t('footer.game_attribution') }}</p>
      </div>
    </div>
  </footer>
</template>
<script setup lang="ts">
  import { useI18n } from 'vue-i18n';
  const { t } = useI18n({ useScope: 'global' });
  const tarkovVersion = useRuntimeConfig().public.tarkovVersion || 'dev';
</script>
