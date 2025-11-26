<template>
  <div
    v-if="!isCollapsed && !mdAndDown"
    class="flex flex-col gap-2 my-4 px-4 items-center"
  >
    <!-- Edition Button -->
    <button
      class="text-xs font-medium text-gray-300 border border-gray-700 rounded px-2 py-1 hover:border-gray-500 hover:text-white transition-colors w-full text-center"
      @click="navigateToSettings"
    >
      {{ getEditionName(tarkovStore.gameEdition) }}
    </button>

    <!-- Faction Button -->
    <button
      class="text-xs font-medium border border-gray-700 rounded px-2 py-1 hover:text-white transition-colors w-full text-center uppercase"
      :class="
        tarkovStore.getPMCFaction() === 'USEC'
          ? 'text-blue-400 hover:border-blue-400'
          : 'text-red-400 hover:border-red-400'
      "
      @click="navigateToSettings"
    >
      {{ tarkovStore.getPMCFaction() }}
    </button>
  </div>
</template>

<script setup>
import { useTarkovStore } from "@/stores/tarkov";
import { getEditionName } from "@/utils/constants";
import { useBreakpoints } from "@vueuse/core";
import { useRouter } from "vue-router";

defineProps({
  isCollapsed: {
    type: Boolean,
    required: true,
  },
});

const tarkovStore = useTarkovStore();
const router = useRouter();
const breakpoints = useBreakpoints({
  mobile: 0,
  md: 960,
});
const mdAndDown = breakpoints.smaller("md");

function navigateToSettings() {
  router.push("/settings");
}
</script>
