<template>
  <header
    class="border-surface-700/50 bg-surface-900 fixed top-0 right-0 z-40 h-11 border-b shadow-[0_1px_0_rgba(0,0,0,0.4)]"
  >
    <div class="flex h-full items-center gap-1 px-2 sm:gap-2 sm:px-3">
      <!-- Left: Toggle Button -->
      <AppTooltip text="Toggle Menu Drawer">
        <UButton
          :icon="navBarIcon"
          variant="ghost"
          color="neutral"
          size="md"
          aria-label="Toggle Menu Drawer"
          :class="{ 'rotate-180': isDrawerCollapsed }"
          class="transition-transform duration-200"
          @click.stop="changeNavigationDrawer"
        />
      </AppTooltip>
      <!-- Center: Page Title -->
      <span class="min-w-0 flex-1 truncate text-base font-semibold text-white">
        {{ pageTitle }}
      </span>
      <!-- Right: Status Icons & Settings -->
      <div class="ml-auto flex items-center gap-1 sm:gap-2">
        <AppTooltip v-if="dataError" text="Error Loading Tarkov Data">
          <span class="inline-flex rounded">
            <UIcon name="i-mdi-database-alert" class="text-error-500 h-5 w-5" />
          </span>
        </AppTooltip>
        <AppTooltip v-if="dataLoading || hideoutLoading" text="Loading Tarkov Data">
          <span class="inline-flex rounded">
            <UIcon name="i-heroicons-arrow-path" class="text-primary-500 h-5 w-5 animate-spin" />
          </span>
        </AppTooltip>
        <!-- Community Links -->
        <AppTooltip :text="t('footer.call_to_action.discord')">
          <a
            href="https://discord.gg/M8nBgA2sT6"
            target="_blank"
            rel="noopener noreferrer"
            class="hover:bg-surface-700 flex h-7 w-7 items-center justify-center rounded transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
              class="text-surface-300 hover:text-white"
              :style="{ color: 'var(--color-discord)' }"
            >
              <path
                d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09c-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33c-.01 0-.02.01-.03.02c-2.72 4.07-3.47 8.03-3.1 11.95c0 .02.01.04.03.05c1.8 1.32 3.53 2.12 5.24 2.65c.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04 0-.08-.04-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08-.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.04.03.04.09-.01.11c-.52.31-1.07.56-1.64.78c-.04.01-.05.06-.04.09c.32.61.68 1.19 1.07 1.74c.03.01.06.02.09.01c1.72-.53 3.45-1.33 5.25-2.65c.02-.01.03-.03.03-.05c.44-4.53-.73-8.46-3.1-11.95c-.01-.01-.02-.02-.04-.02zM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.84 2.12-1.89 2.12zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.83 2.12-1.89 2.12z"
              />
            </svg>
          </a>
        </AppTooltip>
        <AppTooltip :text="t('footer.call_to_action.github')">
          <a
            href="https://github.com/tarkovtracker-org/TarkovTrackerNuxt"
            target="_blank"
            rel="noopener noreferrer"
            class="hover:bg-surface-700 flex h-7 w-7 items-center justify-center rounded transition-colors"
          >
            <UIcon name="i-mdi-github" class="text-surface-300 h-4.5 w-4.5 hover:text-white" />
          </a>
        </AppTooltip>
        <!-- Language selector (compact) -->
        <SelectMenuFixed
          v-model="selectedLocale"
          :items="localeItems"
          value-key="value"
          :search-input="false"
          :content="{ side: 'bottom', align: 'end', sideOffset: 8 }"
        >
          <template #leading>
            <UIcon name="i-mdi-translate" class="text-surface-300 h-4 w-4" />
          </template>
          <template #default>
            <span class="text-xs font-medium text-white/80">
              {{ selectedLocaleLabel }}
            </span>
          </template>
          <template #trailing>
            <UIcon name="i-mdi-chevron-down" class="text-surface-400 h-3 w-3" />
          </template>
        </SelectMenuFixed>
        <!-- Account section -->
        <template v-if="isLoggedIn">
          <div class="bg-surface-700/50 mx-1 h-5 w-px" />
          <UDropdownMenu
            :items="accountItems"
            :content="{ side: 'bottom', align: 'end', sideOffset: 0 }"
            :modal="false"
            :ui="{
              content:
                'bg-surface-800 border border-surface-600 border-t-0 rounded-t-none rounded-b-md min-w-[var(--reka-dropdown-menu-trigger-width)] ring-0 outline-none shadow-none',
              group: 'p-1',
              item: 'px-3 py-1.5 text-sm cursor-pointer rounded text-surface-200 data-[highlighted]:bg-surface-700 data-[highlighted]:text-white',
              itemLeadingIcon: 'size-4 text-surface-400',
            }"
          >
            <button
              type="button"
              class="bg-surface-800/50 border-surface-600 hover:bg-surface-800 data-[state=open]:bg-surface-800 flex items-center gap-2 rounded-md border px-2.5 py-1.5 ring-0 transition-colors outline-none data-[state=open]:rounded-b-none data-[state=open]:border-b-transparent"
              :aria-label="t('navigation_drawer.account_menu', 'Account menu')"
            >
              <UAvatar :src="avatarSrc" size="2xs" alt="User avatar" />
              <span class="text-surface-200 hidden text-sm font-medium sm:inline">
                {{ userDisplayName }}
              </span>
              <UIcon
                name="i-heroicons-chevron-down-20-solid"
                class="text-surface-400 h-3.5 w-3.5 transition-transform duration-200 in-data-[state=open]:rotate-180"
              />
            </button>
          </UDropdownMenu>
        </template>
        <template v-else>
          <div class="bg-surface-700/50 mx-1 h-5 w-px" />
          <UButton
            to="/login"
            icon="i-mdi-fingerprint"
            color="neutral"
            variant="ghost"
            size="sm"
            :label="t('navigation_drawer.login')"
            class="hidden sm:flex"
          />
          <UButton
            to="/login"
            icon="i-mdi-fingerprint"
            color="neutral"
            variant="ghost"
            size="sm"
            class="sm:hidden"
            :aria-label="t('navigation_drawer.login')"
          />
        </template>
      </div>
    </div>
  </header>
</template>
<script setup lang="ts">
  import { useWindowSize } from '@vueuse/core';
  import { storeToRefs } from 'pinia';
  import { computed, onMounted, onUnmounted, ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useRoute } from 'vue-router';
  import { useAppStore } from '@/stores/useApp';
  import { useMetadataStore } from '@/stores/useMetadata';
  import { usePreferencesStore } from '@/stores/usePreferences';
  import { useTarkovStore } from '@/stores/useTarkov';
  import { logger } from '@/utils/logger';
  const { t } = useI18n({ useScope: 'global' });
  const appStore = useAppStore();
  const metadataStore = useMetadataStore();
  const preferencesStore = usePreferencesStore();
  const tarkovStore = useTarkovStore();
  const route = useRoute();
  const { $supabase } = useNuxtApp();
  const isLoggedIn = computed(() => $supabase.user?.loggedIn ?? false);
  const avatarSrc = computed(() => {
    return preferencesStore.getStreamerMode || !$supabase.user.photoURL
      ? '/img/default-avatar.svg'
      : $supabase.user.photoURL;
  });
  const userDisplayName = computed(() => {
    if (preferencesStore.getStreamerMode) return 'User';
    const displayName = tarkovStore.getDisplayName();
    if (displayName && displayName.trim() !== '') {
      return displayName;
    }
    return $supabase.user.displayName || $supabase.user.username || 'User';
  });
  function logout() {
    $supabase.signOut();
  }
  const accountItems = computed(() => [
    {
      label: t('navigation_drawer.logout'),
      icon: 'i-mdi-logout',
      onSelect: logout,
    },
  ]);
  const { width } = useWindowSize();
  const mdAndDown = computed(() => width.value < 960); // md breakpoint at 960px
  const isDrawerCollapsed = computed(() => {
    if (mdAndDown.value) {
      return !appStore.mobileDrawerExpanded;
    }
    return appStore.drawerRail;
  });
  const navBarIcon = computed(() => 'i-mdi-menu-open');
  const { loading: dataLoading, hideoutLoading } = storeToRefs(metadataStore);
  const dataError = ref(false);
  const pageTitle = computed(() =>
    t(`page.${String(route.name || 'index').replace('-', '_')}.title`)
  );
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && appStore.mobileDrawerExpanded && mdAndDown.value) {
      event.preventDefault();
      appStore.setMobileDrawerExpanded(false);
    }
  }
  onMounted(() => {
    document.addEventListener('keydown', handleKeydown);
  });
  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown);
  });
  function changeNavigationDrawer() {
    if (mdAndDown.value) {
      appStore.toggleMobileDrawerExpanded();
    } else {
      appStore.toggleDrawerRail();
    }
  }
  const { locale, availableLocales } = useI18n({ useScope: 'global' });
  const localeItems = computed(() => {
    return availableLocales.map((localeCode) => ({
      label: localeCode.toUpperCase(),
      value: localeCode,
    }));
  });
  const selectedLocaleLabel = computed(() => locale.value.toUpperCase());
  const selectedLocale = computed({
    get() {
      // Return the current locale string directly
      return locale.value;
    },
    set(newValue: string | { value: string }) {
      if (!newValue) return;
      // Handle both string and object values
      const newLocale = typeof newValue === 'string' ? newValue : newValue.value;
      if (newLocale === locale.value) return;
      // Set the i18n locale (this updates the UI translations)
      locale.value = newLocale;
      // Persist in preferences
      preferencesStore.localeOverride = newLocale;
      logger.debug('[AppBar] Setting locale to:', newLocale);
      // Update metadata store and refetch data with new language
      metadataStore.updateLanguageAndGameMode(newLocale);
      // Use cached data if available (forceRefresh = false)
      metadataStore
        .fetchAllData(false)
        .then(() => {
          dataError.value = false;
        })
        .catch((err) => {
          logger.error('[AppBar] Error fetching data:', err);
          dataError.value = true;
        });
    },
  });
</script>
