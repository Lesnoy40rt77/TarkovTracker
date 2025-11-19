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
import { markDataMigrated } from "@/plugins/store-initializer";
import { useTarkovStore, initializeTarkovSync } from "@/stores/tarkov";
import { useTarkovData } from "@/composables/tarkovdata";
const { $supabase } = useNuxtApp();
const appStore = useAppStore();
const { locale } = useI18n({ useScope: "global" });
useTarkovData();
onMounted(async () => {
  if (appStore.localeOverride) {
    locale.value = appStore.localeOverride;
  }
  if ($supabase.user.loggedIn) {
    initializeTarkovSync();
  }
  const wasMigrated = sessionStorage.getItem("tarkovDataMigrated") === "true";
  if (wasMigrated && $supabase.user.loggedIn) {
    markDataMigrated();
    try {
      const store = useTarkovStore();
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
.v-application {
  [class*="text-"] {
    font-family: "Share Tech Mono", sans-serif !important;
    font-display: swap;
  }
  font-family: "Share Tech Mono", sans-serif !important;
  font-display: swap;
  background-color: #0A0A09 !important;
}

.v-main {
  background-color: #0A0A09 !important;
}
</style>
