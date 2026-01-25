<template>
  <Transition
    enter-active-class="transition-opacity duration-300 ease-out"
    leave-active-class="transition-opacity duration-300 ease-in"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <div
      v-if="belowMd && mobileExpanded"
      class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
      @click="closeMobileDrawer"
    />
  </Transition>
  <aside
    class="bg-sidebar border-surface-700/50 fixed inset-y-0 left-0 z-50 flex flex-col border-r shadow-[inset_0_1px_0_rgba(255,255,255,0.03),inset_0_-1px_0_rgba(0,0,0,0.6),1px_0_0_rgba(0,0,0,0.55)] backdrop-blur-sm transition-all duration-300"
    :class="[sidebarWidth]"
  >
    <div
      class="scrollbar-thin relative z-10 flex h-full flex-col overflow-x-hidden overflow-y-auto"
    >
      <NuxtLink
        to="/"
        class="group mt-1 flex shrink-0 flex-col items-center px-3 py-1.5 transition-opacity hover:opacity-90"
      >
        <div
          :class="isCollapsed ? 'w-8' : 'w-32.5'"
          class="relative mx-auto transition-all duration-200"
        >
          <NuxtImg
            :src="
              isCollapsed
                ? '/img/logos/tarkovtrackerlogo-mini.webp'
                : '/img/logos/tarkovtrackerlogo-light.webp'
            "
            class="h-auto w-full"
            preload
          />
        </div>
        <div v-if="!isCollapsed" class="mt-1 text-center">
          <div class="text-base leading-tight font-medium text-white">TarkovTracker.org</div>
        </div>
      </NuxtLink>
      <div class="bg-surface-800 mx-3 my-0.5 h-px shrink-0" />
      <div
        v-if="!isCollapsed"
        class="bg-surface-850 mx-3 my-2 shrink-0 rounded-lg border border-white/10"
      >
        <template v-if="isLoggedIn">
          <div class="flex items-center gap-2 border-b border-white/8 px-3 py-2.5">
            <UAvatar :src="avatarSrc" size="sm" alt="User avatar" class="shrink-0" />
            <span class="text-surface-200 min-w-0 flex-1 truncate text-sm font-medium">
              {{ userDisplayName }}
            </span>
            <UDropdownMenu
              :items="accountItems"
              :content="{ side: 'right', align: 'start' }"
              :ui="{ content: 'min-w-max' }"
            >
              <button
                type="button"
                class="flex h-6 w-6 shrink-0 items-center justify-center rounded transition-colors hover:bg-[--state-hover]"
                :aria-label="t('navigation_drawer.account_menu', 'Account menu')"
              >
                <UIcon name="i-heroicons-ellipsis-vertical" class="text-surface-300 h-4 w-4" />
              </button>
            </UDropdownMenu>
          </div>
        </template>
        <template v-else>
          <NuxtLink
            to="/login"
            class="text-surface-200 flex w-full items-center justify-center gap-2 border-b border-white/8 px-3 py-2.5 text-sm font-medium transition-colors hover:bg-[--state-hover]"
          >
            <UIcon name="i-mdi-fingerprint" class="h-5 w-5" />
            <span>{{ t('navigation_drawer.login') }}</span>
          </NuxtLink>
        </template>
        <DrawerLevel :is-collapsed="false" />
        <DrawerGameSettings />
      </div>
      <template v-else>
        <ul class="flex shrink-0 flex-col gap-1 px-1">
          <template v-if="isLoggedIn">
            <UDropdownMenu
              :items="accountItems"
              :content="{ side: 'right', align: 'start' }"
              :ui="{ content: 'min-w-max' }"
            >
              <UButton
                color="neutral"
                variant="ghost"
                class="h-12 w-full justify-center rounded-md px-0 py-2"
                :aria-label="t('navigation_drawer.account_menu', 'Account menu')"
              >
                <UAvatar :src="avatarSrc" size="md" alt="User avatar" class="shrink-0" />
              </UButton>
            </UDropdownMenu>
          </template>
          <template v-else>
            <UTooltip :text="t('navigation_drawer.login')" :content="{ side: 'right' }">
              <UButton
                to="/login"
                icon="i-mdi-fingerprint"
                color="neutral"
                variant="ghost"
                block
                class="h-12 justify-center rounded-md px-3 py-3"
                :aria-label="t('navigation_drawer.login', 'Login')"
              />
            </UTooltip>
          </template>
        </ul>
        <div class="bg-surface-800 mx-3 my-0.5 h-px shrink-0" />
        <DrawerLevel :is-collapsed="true" />
      </template>
      <div class="bg-surface-800 mx-3 my-2 h-px shrink-0" />
      <DrawerLinks :is-collapsed="isCollapsed" />
      <div class="bg-surface-800 mx-3 my-2 h-px shrink-0" />
      <div class="flex flex-col gap-0.5">
        <div v-if="!isCollapsed" class="px-4 py-2">
          <h3 class="text-surface-400 text-xs font-semibold tracking-wider uppercase">
            {{ t('navigation_drawer.section_external', 'External') }}
          </h3>
        </div>
        <ul class="flex flex-col gap-0.5 px-1">
          <DrawerItem
            avatar="/img/logos/tarkovdevlogo.webp"
            locale-key="tarkovdev"
            href="https://tarkov.dev/"
            :is-collapsed="isCollapsed"
          />
          <DrawerItem
            avatar="/img/logos/tarkovmonitorlogo.avif"
            locale-key="tarkovmonitor"
            href="https://github.com/the-hideout/TarkovMonitor"
            :is-collapsed="isCollapsed"
          />
          <DrawerItem
            avatar="/img/logos/ratscannerlogo.webp"
            locale-key="ratscanner"
            href="https://github.com/RatScanner/RatScanner"
            :is-collapsed="isCollapsed"
          />
          <DrawerItem
            avatar="/img/logos/tarkovchangeslogo.svg"
            locale-key="tarkovchanges"
            href="https://tarkov-changes.com/"
            :is-collapsed="isCollapsed"
          />
        </ul>
      </div>
    </div>
  </aside>
</template>
<script setup lang="ts">
  import { computed, defineAsyncComponent, watch } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useSharedBreakpoints } from '@/composables/useSharedBreakpoints';
  import { useAppStore } from '@/stores/useApp';
  import { usePreferencesStore } from '@/stores/usePreferences';
  import { useTarkovStore } from '@/stores/useTarkov';
  const { belowMd } = useSharedBreakpoints();
  const appStore = useAppStore();
  const mobileExpanded = computed(() => appStore.mobileDrawerExpanded);
  watch(belowMd, (isMobile) => {
    if (!isMobile) {
      appStore.setMobileDrawerExpanded(false);
    }
  });
  const closeMobileDrawer = () => {
    appStore.setMobileDrawerExpanded(false);
  };
  const isCollapsed = computed(() => {
    if (belowMd.value) {
      return !mobileExpanded.value;
    }
    return appStore.drawerRail;
  });
  const sidebarWidth = computed(() => {
    if (belowMd.value) {
      return mobileExpanded.value ? 'w-56' : 'w-16';
    }
    return appStore.drawerRail ? 'w-16' : 'w-56';
  });
  const DrawerLinks = defineAsyncComponent(() => import('@/features/drawer/DrawerLinks.vue'));
  const DrawerLevel = defineAsyncComponent(() => import('@/features/drawer/DrawerLevel.vue'));
  const DrawerGameSettings = defineAsyncComponent(
    () => import('@/features/drawer/DrawerGameSettings.vue')
  );
  const DrawerItem = defineAsyncComponent(() => import('@/features/drawer/DrawerItem.vue'));
  const preferencesStore = usePreferencesStore();
  const tarkovStore = useTarkovStore();
  const { t } = useI18n({ useScope: 'global' });
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
      icon: 'i-mdi-lock',
      onSelect: logout,
    },
  ]);
</script>
