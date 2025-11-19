<template>
  <!-- Navigation Drawer -->
  <NavDrawer />
  <!-- Application Bar-->
  <AppBar />
  <!-- Main View -->
  <v-main
    style="
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      padding-bottom: 0 !important;
      margin-bottom: 0 !important;
    "
  >
    <div class="d-flex flex-column justify-space-between" style="flex: 1 1 auto;">
      <div class="flex-grow-1" style="padding: 8px 8px 0">
        <slot />
      </div>
      <AppFooter
        style="margin-top: auto; flex-shrink: 0; margin-bottom: 0 !important"
      />
    </div>
  </v-main>
</template>
<script setup lang="ts">
import { defineAsyncComponent } from "vue";

// Lazy-load layout components
const NavDrawer = defineAsyncComponent(
  () => import("@/features/layout/NavDrawer.vue")
);
const AppFooter = defineAsyncComponent(
  () => import("@/features/layout/AppFooter.vue")
);
const AppBar = defineAsyncComponent(
  () => import("@/features/layout/AppBar.vue")
);
</script>
<style lang="scss" scoped>
// Global overrides to ensure no bottom spacing
:deep(.v-main) {
  padding-bottom: 0 !important;
  margin-bottom: 0 !important;
}
:deep(.v-main__wrap) {
  padding-bottom: 0 !important;
  margin-bottom: 0 !important;
}
</style>
