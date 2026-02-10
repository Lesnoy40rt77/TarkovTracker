<template>
  <GenericCard
    icon="mdi-palette"
    icon-color="accent"
    highlight-color="accent"
    :fill-height="false"
    :title="$t('settings.interface.title')"
    title-classes="text-lg font-semibold"
  >
    <template #content>
      <div class="space-y-6 px-4 py-4">
        <div class="space-y-3">
          <h3 class="text-surface-200 text-sm font-semibold tracking-wider uppercase">
            {{ $t('settings.interface.tasks.title') }}
          </h3>
          <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <UCheckbox
              v-model="showRequiredLabels"
              :label="$t('settings.interface.tasks.show_required')"
            />
            <UCheckbox
              v-model="showExperienceRewards"
              :label="$t('settings.interface.tasks.show_xp')"
            />
            <UCheckbox v-model="showNextQuests" :label="$t('settings.interface.tasks.show_next')" />
            <UCheckbox
              v-model="showPreviousQuests"
              :label="$t('settings.interface.tasks.show_prev')"
            />
          </div>
          <div class="mt-4 max-w-xs space-y-2">
            <p class="text-surface-300 text-sm">
              {{ $t('settings.interface.tasks.density') }}
            </p>
            <SelectMenuFixed
              v-model="taskCardDensity"
              :items="densityOptions"
              value-key="value"
              label-key="label"
            />
          </div>
        </div>
        <USeparator />
        <div class="space-y-3">
          <h3 class="text-surface-200 text-sm font-semibold tracking-wider uppercase">
            {{ $t('settings.interface.defaults.title') }}
          </h3>
          <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div class="space-y-1">
              <span class="text-sm font-medium">{{ $t('page.tasks.title') }}</span>
              <SelectMenuFixed
                v-model="taskDefaultView"
                :items="taskViewOptions"
                value-key="value"
                label-key="label"
              />
            </div>
            <div class="space-y-1">
              <span class="text-sm font-medium">{{ $t('page.hideout.title') }}</span>
              <SelectMenuFixed
                v-model="hideoutDefaultView"
                :items="hideoutViewOptions"
                value-key="value"
                label-key="label"
              />
            </div>
          </div>
        </div>
        <USeparator />
        <div class="space-y-3">
          <h3 class="text-surface-200 text-sm font-semibold tracking-wider uppercase">
            {{ $t('settings.interface.maps.title') }}
          </h3>
          <div class="grid gap-4 md:grid-cols-3">
            <UCheckbox
              v-model="showMapExtracts"
              :label="$t('settings.interface.maps.show_extracts')"
            />
            <div class="space-y-1">
              <div class="flex justify-between">
                <span class="text-sm font-medium">
                  {{ $t('settings.interface.maps.zoom_speed') }}
                </span>
                <span class="text-surface-200 text-xs">{{ mapZoomSpeed }}x</span>
              </div>
              <input
                v-model.number="mapZoomSpeed"
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                class="bg-surface-700 accent-surface-200 h-2 w-full cursor-pointer appearance-none rounded-lg"
              />
            </div>
            <div class="space-y-1">
              <div class="flex justify-between">
                <span class="text-sm font-medium">
                  {{ $t('settings.interface.maps.pan_speed') }}
                </span>
                <span class="text-surface-200 text-xs">{{ mapPanSpeed.toFixed(1) }}x</span>
              </div>
              <input
                v-model.number="mapPanSpeed"
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                class="bg-surface-700 accent-surface-200 h-2 w-full cursor-pointer appearance-none rounded-lg"
              />
            </div>
          </div>
          <div class="bg-surface-800/50 border-surface-700 space-y-3 rounded-lg border p-3">
            <div class="flex items-center justify-between gap-3">
              <div class="space-y-0.5">
                <p class="text-surface-200 text-sm font-medium">
                  {{ $t('settings.interface.maps.colors.title') }}
                </p>
                <p class="text-surface-400 text-xs">
                  {{ $t('settings.interface.maps.colors.description') }}
                </p>
              </div>
              <UButton
                color="neutral"
                size="xs"
                variant="ghost"
                @click="preferencesStore.resetMapMarkerColors()"
              >
                {{ $t('settings.interface.maps.colors.reset') }}
              </UButton>
            </div>
            <div class="grid gap-2 md:grid-cols-2">
              <label
                v-for="option in mapColorOptions"
                :key="option.key"
                class="bg-surface-900/40 border-surface-700 flex items-center justify-between gap-3 rounded-md border px-2.5 py-2"
              >
                <span class="flex items-center gap-2">
                  <span
                    class="h-3.5 w-3.5 rounded-full border border-white/30"
                    :style="{ backgroundColor: mapMarkerColors[option.key] }"
                  />
                  <span class="text-surface-200 text-xs font-medium">
                    {{ option.label }}
                  </span>
                </span>
                <input
                  :aria-label="option.label"
                  :value="mapMarkerColors[option.key]"
                  type="color"
                  class="bg-surface-900 border-surface-700 h-8 w-11 cursor-pointer rounded border p-1"
                  @input="onMapColorInput(option.key, $event)"
                />
              </label>
            </div>
          </div>
        </div>
        <USeparator />
        <div class="space-y-3">
          <h3 class="text-surface-200 text-sm font-semibold tracking-wider uppercase">
            {{ $t('settings.interface.misc.title') }}
          </h3>
          <div
            class="bg-surface-800/50 border-surface-700 flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
          >
            <div class="space-y-0.5">
              <p class="text-surface-200 text-sm font-medium">
                {{ $t('settings.general.privacy_mode') }}
              </p>
              <p class="text-surface-400 text-xs">
                {{ $t('settings.general.privacy_mode_hint') }}
              </p>
            </div>
            <USwitch v-model="streamerMode" :disabled="!isLoggedIn || streamerModeCooldown" />
          </div>
        </div>
      </div>
    </template>
  </GenericCard>
</template>
<script setup lang="ts">
  import { useI18n } from 'vue-i18n';
  import GenericCard from '@/components/ui/GenericCard.vue';
  import { usePreferencesStore } from '@/stores/usePreferences';
  import { getMapColorOptions, type MapMarkerColorKey } from '@/utils/theme-colors';
  import type { SupabaseUser } from '@/types/supabase-plugin';
  const preferencesStore = usePreferencesStore();
  const { t } = useI18n({ useScope: 'global' });
  const { $supabase } = useNuxtApp();
  const typedUser = computed<SupabaseUser | null>(() => {
    const supabase = $supabase as { user?: SupabaseUser } | undefined;
    return supabase?.user ?? null;
  });
  const streamerModeCooldown = ref(false);
  let streamerModeTimeoutId: ReturnType<typeof setTimeout> | null = null;
  const isLoggedIn = computed(() => Boolean(typedUser.value?.loggedIn));
  const streamerMode = computed({
    get() {
      return preferencesStore.getStreamerMode;
    },
    set(newValue) {
      if (streamerModeCooldown.value) return;
      preferencesStore.setStreamerMode(newValue);
      streamerModeCooldown.value = true;
      streamerModeTimeoutId = setTimeout(() => {
        streamerModeCooldown.value = false;
        streamerModeTimeoutId = null;
      }, 500);
    },
  });
  onUnmounted(() => {
    if (streamerModeTimeoutId) {
      clearTimeout(streamerModeTimeoutId);
      streamerModeTimeoutId = null;
    }
  });
  const showRequiredLabels = computed({
    get: () => preferencesStore.getShowRequiredLabels,
    set: (val) => preferencesStore.setShowRequiredLabels(val),
  });
  const showExperienceRewards = computed({
    get: () => preferencesStore.getShowExperienceRewards,
    set: (val) => preferencesStore.setShowExperienceRewards(val),
  });
  const showNextQuests = computed({
    get: () => preferencesStore.getShowNextQuests,
    set: (val) => preferencesStore.setShowNextQuests(val),
  });
  const showPreviousQuests = computed({
    get: () => preferencesStore.getShowPreviousQuests,
    set: (val) => preferencesStore.setShowPreviousQuests(val),
  });
  const taskCardDensity = computed({
    get: () => preferencesStore.getTaskCardDensity,
    set: (val) => preferencesStore.setTaskCardDensity(val),
  });
  const densityOptions = computed(() => [
    { label: t('settings.density.compact'), value: 'compact' },
    { label: t('settings.density.comfortable'), value: 'comfortable' },
  ]);
  const taskDefaultView = computed({
    get: () => preferencesStore.getTaskPrimaryView,
    set: (val) => preferencesStore.setTaskPrimaryView(val),
  });
  const taskViewOptions = computed(() => [
    { label: t('tasks.view.all'), value: 'all' },
    { label: t('tasks.view.map'), value: 'maps' },
    { label: t('tasks.view.traders'), value: 'traders' },
  ]);
  const hideoutDefaultView = computed({
    get: () => preferencesStore.getHideoutPrimaryView,
    set: (val) => preferencesStore.setHideoutPrimaryView(val),
  });
  const hideoutViewOptions = computed(() => [
    { label: t('hideout.view.available'), value: 'available' },
    { label: t('hideout.view.all'), value: 'all' },
    { label: t('hideout.view.maxed'), value: 'maxed' },
    { label: t('hideout.view.locked'), value: 'locked' },
  ]);
  const showMapExtracts = computed({
    get: () => preferencesStore.getShowMapExtracts,
    set: (val) => preferencesStore.setShowMapExtracts(val),
  });
  const mapZoomSpeed = computed({
    get: () => preferencesStore.getMapZoomSpeed,
    set: (val) => preferencesStore.setMapZoomSpeed(val),
  });
  const mapPanSpeed = computed({
    get: () => preferencesStore.getMapPanSpeed,
    set: (val) => preferencesStore.setMapPanSpeed(val),
  });
  const mapMarkerColors = computed(() => preferencesStore.getMapMarkerColors);
  const mapColorOptions = computed(() => getMapColorOptions(t));
  const onMapColorInput = (key: MapMarkerColorKey, event: Event) => {
    const input = event.target as HTMLInputElement | null;
    if (!input) return;
    preferencesStore.setMapMarkerColor(key, input.value);
  };
</script>
