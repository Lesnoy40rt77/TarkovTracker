<template>
  <header
    class="border-surface-700/50 bg-surface-900 fixed top-0 right-0 z-40 h-11 border-b shadow-[0_1px_0_rgba(0,0,0,0.4)]"
  >
    <div class="flex h-full items-center gap-1 px-2 sm:gap-2 sm:px-3">
      <!-- Left: Toggle Button -->
      <AppTooltip :text="t('navigation_drawer.toggle', 'Toggle Menu Drawer')">
        <UButton
          :icon="NAV_BAR_ICON"
          variant="ghost"
          color="neutral"
          size="md"
          :aria-label="t('navigation_drawer.toggle', 'Toggle Menu Drawer')"
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
        <AppTooltip
          v-if="dataError"
          :text="t('app_bar.error_loading', 'Error Loading Tarkov Data')"
        >
          <span class="inline-flex rounded">
            <UIcon name="i-mdi-database-alert" class="text-error-500 h-5 w-5" />
          </span>
        </AppTooltip>
        <AppTooltip
          v-if="dataLoading || hideoutLoading"
          :text="t('app_bar.loading', 'Loading Tarkov Data')"
        >
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
            <DiscordIcon class="text-discord hover:text-white" />
          </a>
        </AppTooltip>
        <AppTooltip :text="t('footer.call_to_action.github')">
          <a
            href="https://github.com/tarkovtracker-org/TarkovTracker"
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
            :ui="DROPDOWN_MENU_UI_CONFIG"
          >
            <button
              type="button"
              class="bg-surface-800/50 border-surface-600 hover:bg-surface-800 data-[state=open]:bg-surface-800 flex items-center gap-2 rounded-md border px-2.5 py-1.5 ring-0 transition-colors outline-none data-[state=open]:rounded-b-none data-[state=open]:border-b-transparent"
              :aria-label="t('navigation_drawer.account_menu', 'Account menu')"
            >
              <UAvatar
                :src="avatarSrc"
                size="2xs"
                :alt="t('app_bar.user_avatar_alt', 'User avatar')"
              />
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
            :label="t('navigation_drawer.login', 'Login')"
            class="hidden sm:flex"
          />
          <UButton
            to="/login"
            icon="i-mdi-fingerprint"
            color="neutral"
            variant="ghost"
            size="sm"
            class="sm:hidden"
            :aria-label="t('navigation_drawer.login', 'Login')"
          />
        </template>
      </div>
    </div>
  </header>
</template>
<script setup lang="ts">
  import { useWindowSize } from '@vueuse/core';
  import { storeToRefs } from 'pinia';
  import { useI18n } from 'vue-i18n';
  import { useAppStore } from '@/stores/useApp';
  import { useMetadataStore } from '@/stores/useMetadata';
  import { usePreferencesStore } from '@/stores/usePreferences';
  import { useTarkovStore } from '@/stores/useTarkov';
  import { DROPDOWN_MENU_UI_CONFIG } from '@/utils/dropdownMenuUIConfig';
  import { logger } from '@/utils/logger';
  const { t } = useI18n({ useScope: 'global' });
  const appStore = useAppStore();
  const metadataStore = useMetadataStore();
  const preferencesStore = usePreferencesStore();
  const tarkovStore = useTarkovStore();
  const route = useRoute();
  const { $supabase } = useNuxtApp();
  const toast = useToast();
  const isLoggedIn = computed(() => $supabase.user?.loggedIn ?? false);
  const avatarSrc = computed(() => {
    return preferencesStore.getStreamerMode || !$supabase.user.photoURL
      ? '/img/default-avatar.svg'
      : $supabase.user.photoURL;
  });
  const userDisplayName = computed(() => {
    const fallbackLabel = t('app_bar.user_label', 'User');
    if (preferencesStore.getStreamerMode) return fallbackLabel;
    const displayName = tarkovStore.getDisplayName();
    if (displayName && displayName.trim() !== '') {
      return displayName;
    }
    return $supabase.user.displayName || $supabase.user.username || fallbackLabel;
  });
  async function logout() {
    try {
      await $supabase.signOut();
    } catch (error) {
      logger.error('[AppBar] Sign out failed:', error);
      toast.add({
        title: t('app_bar.logout_failed'),
        color: 'error',
      });
    }
  }
  const accountItems = computed(() => [
    {
      label: t('navigation_drawer.logout'),
      icon: 'i-mdi-logout',
      onSelect: logout,
    },
  ]);
  const { width } = useWindowSize();
  const mdAndDown = computed(() => width.value < 960);
  const isDrawerCollapsed = computed(() => {
    if (mdAndDown.value) {
      return !appStore.mobileDrawerExpanded;
    }
    return appStore.drawerRail;
  });
  const NAV_BAR_ICON = 'i-mdi-menu-open';
  const { loading: dataLoading, hideoutLoading } = storeToRefs(metadataStore);
  const dataError = ref(false);
  const pageTitleKey = computed(() => {
    const name = String(route.name || 'index');
    if (name === 'needed-items' || name === 'neededitems') {
      return 'page.needed_items.title';
    }
    return `page.${name.replaceAll('-', '_')}.title`;
  });
  const pageTitle = computed(() => t(pageTitleKey.value));
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
  const isAvailableLocale = (value: string): value is typeof locale.value =>
    (availableLocales as readonly string[]).includes(value);
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
      if (!isAvailableLocale(newLocale) || newLocale === locale.value) return;
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
