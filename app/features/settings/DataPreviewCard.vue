<template>
  <div>
    <div class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
      <div class="border-surface-700 rounded-lg border p-1">
        <div class="px-4 py-2 text-base font-medium">PMC Information</div>
        <div class="space-y-2 px-2">
          <div class="flex items-center p-2">
            <UIcon name="i-mdi-account" class="text-surface-400 mr-3 h-6 w-6" />
            <span>Level: {{ data?.level || 'N/A' }}</span>
          </div>
          <div class="flex items-center p-2">
            <UIcon name="i-mdi-shield" class="text-surface-400 mr-3 h-6 w-6" />
            <span>Faction: {{ data?.pmcFaction || 'N/A' }}</span>
          </div>
          <div class="flex items-center p-2">
            <UIcon name="i-mdi-package-variant" class="text-surface-400 mr-3 h-6 w-6" />
            <span class="overflow-visible whitespace-normal">Edition: {{ editionName }}</span>
          </div>
        </div>
      </div>
      <div class="border-surface-700 rounded-lg border p-1">
        <div class="px-4 py-2 text-base font-medium">Task Progress</div>
        <div class="space-y-2 px-2">
          <div class="flex items-center p-2">
            <UIcon name="i-mdi-check-circle" class="text-surface-400 mr-3 h-6 w-6" />
            <div class="flex items-center">Completed Tasks: {{ completedTasks }}</div>
          </div>
          <div class="flex items-center p-2">
            <UIcon name="i-mdi-format-list-checks" class="text-surface-400 mr-3 h-6 w-6" />
            <div class="flex items-center">
              Task Objectives: {{ taskObjectives }}
              <UButton
                size="xs"
                icon="i-mdi-information-outline"
                variant="ghost"
                color="neutral"
                class="ml-2"
                @click="$emit('show-objectives-details')"
              />
            </div>
          </div>
          <div v-if="failedTasks > 0" class="flex items-center p-2">
            <UIcon name="i-mdi-close-circle" class="text-surface-400 mr-3 h-6 w-6" />
            <div class="flex items-center">
              Failed Tasks: {{ failedTasks }}
              <UButton
                size="xs"
                icon="i-mdi-information-outline"
                variant="ghost"
                color="neutral"
                class="ml-2"
                @click="$emit('show-failed-tasks-details')"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="mb-4">
      <div class="border-surface-700 rounded-lg border p-1">
        <div class="px-4 py-2 text-base font-medium">Hideout Progress</div>
        <div class="space-y-2 px-2">
          <div class="flex items-center p-2">
            <UIcon name="i-mdi-home" class="text-surface-400 mr-3 h-6 w-6" />
            <span>Completed Modules: {{ hideoutModules }}</span>
          </div>
          <div class="flex items-center p-2">
            <UIcon name="i-mdi-tools" class="text-surface-400 mr-3 h-6 w-6" />
            <span>Tracked Materials: {{ hideoutParts }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
  import { useMetadataStore } from '@/stores/useMetadata';
  const metadataStore = useMetadataStore();
  const props = defineProps({
    data: {
      type: Object,
      default: null,
    },
    completedTasks: {
      type: Number,
      default: 0,
    },
    failedTasks: {
      type: Number,
      default: 0,
    },
    taskObjectives: {
      type: Number,
      default: 0,
    },
    hideoutModules: {
      type: Number,
      default: 0,
    },
    hideoutParts: {
      type: Number,
      default: 0,
    },
  });
  defineEmits(['show-objectives-details', 'show-failed-tasks-details']);
  const editionName = computed(() => {
    const editionValue = props.data?.gameEdition;
    if (!editionValue) return 'N/A';
    const editions = metadataStore.editions;
    if (!Array.isArray(editions)) return `Edition ${editionValue}`;
    const edition = editions.find((item) => item.value === editionValue);
    return edition?.title ?? `Edition ${editionValue}`;
  });
</script>
