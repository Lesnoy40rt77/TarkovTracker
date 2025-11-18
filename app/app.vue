<template>
  <v-app color="rgba(0, 0, 0, 1)">
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </v-app>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useAppStore } from "@/stores/app";
// import { fireuser } from '@/plugins/firebase.client';
import { markDataMigrated } from "@/plugins/store-initializer";
import { useTarkovStore, initializeTarkovSync } from "@/stores/tarkov";
import { useTarkovData } from "@/composables/tarkovdata";
// import type { StoreWithFireswapExt } from '@/plugins/pinia-firestore';

const { $supabase } = useNuxtApp();
const appStore = useAppStore();
const { locale } = useI18n({ useScope: "global" });

// Initialize Tarkov data globally to ensure it's available for any route
useTarkovData();

onMounted(async () => {
  // Check our locale settings
  if (appStore.localeOverride) {
    locale.value = appStore.localeOverride;
  }

  // Initialize Supabase sync for tarkov store
  if ($supabase.user.loggedIn) {
    initializeTarkovSync();
  }

  // Check for migration flag in sessionStorage
  const wasMigrated = sessionStorage.getItem("tarkovDataMigrated") === "true";
  if (wasMigrated && $supabase.user.loggedIn) {
    // Re-set the migration flag
    markDataMigrated();
    // Store initialization now handled by Supabase listeners
    try {
      const store = useTarkovStore();
      // Trigger migration check if needed
      if (typeof store.migrateDataIfNeeded === "function") {
        store.migrateDataIfNeeded();
      }
    } catch (error) {
      console.error("Error initializing store in App component:", error);
    }
  }
});
</script>

<style lang="scss">
// Set the font family for the application to Share Tech Mono
.v-application {
  [class*="text-"] {
    font-family: "Share Tech Mono", sans-serif !important;
    font-display: swap;
  }
  font-family: "Share Tech Mono", sans-serif !important;
  font-display: swap;
}
</style>
