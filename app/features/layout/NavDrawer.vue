<template>
  <!-- Mobile Drawer -->
  <USlideover
    v-if="mdAndDown"
    v-model="drawerOpen"
    side="left"
    :ui="{ width: 'max-w-xs' }"
  >
    <div
      class="flex grow flex-col gap-y-5 overflow-y-auto bg-background px-6 pb-4 ring-1 ring-white/10 h-full relative"
    >
      <div class="relative z-10 flex flex-col h-full">
        <TrackerLogo :is-collapsed="false" />
        <div class="h-px bg-white/10 my-1" />
        <DrawerAccount :is-collapsed="false" />
        <div class="h-px bg-white/10 my-1" />
        <DrawerLevel :is-collapsed="false" />
        <DrawerCharacter :is-collapsed="false" />
        <div class="h-px bg-white/10 my-1" />
        <DrawerLinks :is-collapsed="false" />
        <div class="h-px bg-white/10 my-1" />
        <DrawerExternalLinks :is-collapsed="false" />
      </div>
    </div>
  </USlideover>
  <!-- Desktop Sidebar -->
  <aside
    v-show="!mdAndDown"
    class="flex flex-col fixed inset-y-0 left-0 z-30 bg-background border-r border-white/10 transition-all duration-300"
    :class="[isRailActive ? 'w-14' : 'w-56']"
  >
    <div
      class="relative z-10 flex flex-col h-full overflow-y-auto overflow-x-hidden"
    >
      <TrackerLogo :is-collapsed="isRailActive" />
      <div class="h-px bg-white/10 mx-3 my-1" />
      <DrawerAccount :is-collapsed="isRailActive" />
      <div class="h-px bg-white/10 mx-3 my-1" />
      <DrawerLevel :is-collapsed="isRailActive" />
      <DrawerCharacter :is-collapsed="isRailActive" />
      <div class="h-px bg-white/10 mx-3 my-1" />
      <DrawerLinks :is-collapsed="isRailActive" />
      <div class="h-px bg-white/10 mx-3 my-1" />
      <DrawerExternalLinks :is-collapsed="isRailActive" />
    </div>
  </aside>
</template>
<script setup>
import { defineAsyncComponent, computed } from "vue";
import { useAppStore } from "@/stores/app";
import { useBreakpoints } from "@vueuse/core";
// Define breakpoints (matching Vuetify's md breakpoint at 960px)
const breakpoints = useBreakpoints({
  mobile: 0,
  md: 960,
});
const mdAndDown = breakpoints.smaller("md");
const appStore = useAppStore();
const isRailActive = computed(() => !mdAndDown.value && appStore.drawerRail);
const drawerOpen = computed({
  get: () => mdAndDown.value && appStore.drawerShow,
  set: (val) => {
    appStore.drawerShow = val;
  },
});
const TrackerLogo = defineAsyncComponent(() =>
  import("@/features/drawer/TrackerLogo.vue")
);
const DrawerLinks = defineAsyncComponent(() =>
  import("@/features/drawer/DrawerLinks.vue")
);
const DrawerAccount = defineAsyncComponent(() =>
  import("@/features/drawer/DrawerAccount.vue")
);
const DrawerLevel = defineAsyncComponent(() =>
  import("@/features/drawer/DrawerLevel.vue")
);
const DrawerExternalLinks = defineAsyncComponent(() =>
  import("@/features/drawer/DrawerExternalLinks.vue")
);
const DrawerCharacter = defineAsyncComponent(() =>
  import("@/features/drawer/DrawerCharacter.vue")
);
</script>
