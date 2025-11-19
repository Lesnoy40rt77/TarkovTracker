<template>
  <v-navigation-drawer
    v-model="appStore.drawerShow"
    theme="dark"
    image="/img/background/sidebar-background.webp"
    :rail="isRailActive"
    :width="isRailActive ? 56 : 200"
    class="compact-nav-drawer"
  >
    <TrackerLogo :is-collapsed="isRailActive" />
    <v-divider class="mx-3 my-1" />
    <DrawerAccount :is-collapsed="isRailActive" />
    <v-divider class="mx-3 my-1" />
    <DrawerLevel :is-collapsed="isRailActive" />
    <v-divider class="mx-3 my-1" />
    <DrawerLinks :is-collapsed="isRailActive" />
    <v-divider class="mx-3 my-1" />
    <DrawerExternalLinks :is-collapsed="isRailActive" />
  </v-navigation-drawer>
</template>
<script setup>
import { defineAsyncComponent, computed } from "vue";
import { useAppStore } from "@/stores/app";
import { useDisplay } from "vuetify";
const { mdAndDown } = useDisplay();
const appStore = useAppStore();
const isRailActive = computed(() => !mdAndDown.value && appStore.drawerRail);
const TrackerLogo = defineAsyncComponent(
  () => import("@/features/drawer/TrackerLogo.vue")
);
const DrawerLinks = defineAsyncComponent(
  () => import("@/features/drawer/DrawerLinks.vue")
);
const DrawerAccount = defineAsyncComponent(
  () => import("@/features/drawer/DrawerAccount.vue")
);
const DrawerLevel = defineAsyncComponent(
  () => import("@/features/drawer/DrawerLevel.vue")
);
const DrawerExternalLinks = defineAsyncComponent(
  () => import("@/features/drawer/DrawerExternalLinks.vue")
);
</script>
<style lang="scss" scoped>
:deep(.v-list-group__items .v-list-item) {
  padding-inline-start: 0 !important;
  padding-left: 8px !important;
}
.compact-nav-drawer {
  /* Remove width: auto, use fixed width for proper collapse */
  box-sizing: border-box !important;
}
</style>
