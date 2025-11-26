<template>
  <div
    class="max-w-[85vw] bg-surface-900 border border-white/10 rounded-lg p-2 max-h-[80vh] overflow-y-auto"
  >
    <!-- Language Selection -->
    <div class="space-y-2 min-w-0">
      <label
        class="text-[11px] text-surface-100 uppercase tracking-wide font-semibold"
      >
        {{ $t("app_bar.overflow_menu.language") }}
      </label>
      <USelectMenu
        v-model="currentLocale"
        :items="localeItems"
        value-key="value"
        size="md"
        class="w-full"
        :search-input="false"
        :popper="{ placement: 'bottom-start', strategy: 'fixed' }"
        highlight-on-hover
        :ui="selectUi"
      >
        <template #leading>
          <UIcon
            name="i-mdi-translate"
            class="w-4 h-4 text-surface-300 shrink-0"
          />
        </template>
      </USelectMenu>
    </div>
    <div class="border-t border-white/10 pt-3 mt-3">
      <UButton
        block
        variant="solid"
        color="neutral"
        class="font-semibold"
        :ui="{
          base:
            'bg-[#9A8866] hover:bg-[#8b7b5c] active:bg-[#7d6d54] text-white border border-[#7d6d54]',
        }"
        @click="goToSettings"
      >
        {{ $t("app_bar.overflow_menu.open_settings", "Open Settings") }}
      </UButton>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { usePreferencesStore } from "@/stores/preferences";

// Define emits
const emit = defineEmits(["close"]);
const preferencesStore = usePreferencesStore();
const selectUi = {
  // Trigger
  base:
    "relative group inline-flex items-center w-full rounded-md bg-surface-900 border border-white/15 text-surface-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-white/20 disabled:cursor-not-allowed disabled:opacity-75 ps-10 pe-10 h-11 cursor-pointer",
  placeholder: "truncate text-surface-500",
  value: "truncate pointer-events-none",
  // Menu / items
  content:
    "max-h-60 min-w-[var(--reka-select-trigger-width)] min-w-[var(--reka-combobox-trigger-width)] w-[var(--reka-combobox-trigger-width)] bg-surface-900 shadow-xl rounded-md ring ring-white/10 overflow-hidden",
  group: "p-1",
  item:
    "group relative flex items-center gap-2 w-full rounded-md px-3 py-2 text-sm cursor-pointer select-none transition-colors hover:bg-surface-800 hover:text-white data-[highlighted]:bg-surface-800 data-[highlighted]:text-white",
  itemWrapper: "flex-1 min-w-0 cursor-pointer",
  itemLabel: "truncate",
  itemTrailing: "ms-auto inline-flex items-center gap-1 text-primary-300",
  itemTrailingIcon: "text-primary-300",
};
const { locale } = useI18n({ useScope: "global" });
// Language options - derive from available locales so it stays in sync with settings page
const { availableLocales } = useI18n({ useScope: "global" });
const localeItems = computed(() => {
  const languageNames = new Intl.DisplayNames(["en"], { type: "language" });
  return availableLocales.map((localeCode) => ({
    label: languageNames.of(localeCode) || localeCode.toUpperCase(),
    value: localeCode,
  }));
});
const currentLocale = computed({
  get() {
    return locale.value;
  },
  set(newValue: string) {
    if (!newValue) return;
    locale.value = newValue;
    // Fix eslint error by avoiding 'any' type
    preferencesStore.setLocaleOverride(newValue);
  },
});
const goToSettings = async () => {
  await navigateTo("/settings");
  emit("close");
};
</script>