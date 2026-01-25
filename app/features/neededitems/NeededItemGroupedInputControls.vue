<template>
  <div class="space-y-3">
    <div v-if="firNeeded > 0" class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-2">
        <UIcon name="i-mdi-checkbox-marked-circle-outline" class="text-warning-400 h-4 w-4" />
        <span class="text-sm font-medium">FIR</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="bg-surface-700 flex items-center rounded-lg border border-white/20">
          <button
            class="text-surface-200 hover:bg-surface-600 active:bg-surface-500 flex h-8 w-8 items-center justify-center rounded-l-lg transition-colors hover:text-white"
            aria-label="Decrease FIR count"
            @click="decreaseFir"
          >
            <UIcon name="i-mdi-minus" class="h-4 w-4" />
          </button>
          <div
            class="bg-surface-800 flex h-8 min-w-16 items-center justify-center border-x border-white/20"
          >
            <input
              v-if="isEditingFir"
              ref="firInputRef"
              v-model.number="firEditValue"
              type="number"
              :min="0"
              class="bg-surface-900 focus:ring-primary-500 h-full w-full px-2 text-center text-sm font-semibold text-white focus:ring-2 focus:outline-none focus:ring-inset"
              @blur="submitFirEdit"
              @keydown.enter="submitFirEdit"
              @keydown.escape="cancelFirEdit"
            />
            <button
              v-else
              class="hover:bg-surface-600 h-full w-full px-2 text-sm font-semibold text-white transition-colors"
              @click="startFirEdit"
            >
              {{ firCurrent }}
            </button>
          </div>
          <button
            class="text-surface-200 hover:bg-surface-600 active:bg-surface-500 flex h-8 w-8 items-center justify-center rounded-r-lg transition-colors hover:text-white"
            aria-label="Increase FIR count"
            @click="increaseFir"
          >
            <UIcon name="i-mdi-plus" class="h-4 w-4" />
          </button>
        </div>
        <span class="text-surface-400 text-sm">/ {{ firNeeded }} needed</span>
      </div>
    </div>
    <div v-if="nonFirNeeded > 0" class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-2">
        <UIcon name="i-mdi-checkbox-blank-circle-outline" class="text-surface-400 h-4 w-4" />
        <span class="text-sm font-medium">Non-FIR</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="bg-surface-700 flex items-center rounded-lg border border-white/20">
          <button
            class="text-surface-200 hover:bg-surface-600 active:bg-surface-500 flex h-8 w-8 items-center justify-center rounded-l-lg transition-colors hover:text-white"
            aria-label="Decrease Non-FIR count"
            @click="decreaseNonFir"
          >
            <UIcon name="i-mdi-minus" class="h-4 w-4" />
          </button>
          <div
            class="bg-surface-800 flex h-8 min-w-16 items-center justify-center border-x border-white/20"
          >
            <input
              v-if="isEditingNonFir"
              ref="nonFirInputRef"
              v-model.number="nonFirEditValue"
              type="number"
              :min="0"
              class="bg-surface-900 focus:ring-primary-500 h-full w-full px-2 text-center text-sm font-semibold text-white focus:ring-2 focus:outline-none focus:ring-inset"
              @blur="submitNonFirEdit"
              @keydown.enter="submitNonFirEdit"
              @keydown.escape="cancelNonFirEdit"
            />
            <button
              v-else
              class="hover:bg-surface-600 h-full w-full px-2 text-sm font-semibold text-white transition-colors"
              @click="startNonFirEdit"
            >
              {{ nonFirCurrent }}
            </button>
          </div>
          <button
            class="text-surface-200 hover:bg-surface-600 active:bg-surface-500 flex h-8 w-8 items-center justify-center rounded-r-lg transition-colors hover:text-white"
            aria-label="Increase Non-FIR count"
            @click="increaseNonFir"
          >
            <UIcon name="i-mdi-plus" class="h-4 w-4" />
          </button>
        </div>
        <span class="text-surface-400 text-sm">/ {{ nonFirNeeded }} needed</span>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
  import { ref, nextTick, watch } from 'vue';
  const props = defineProps<{
    firNeeded: number;
    firCurrent: number;
    nonFirNeeded: number;
    nonFirCurrent: number;
  }>();
  const emit = defineEmits<{
    'update:fir': [count: number];
    'update:nonFir': [count: number];
  }>();
  const isEditingFir = ref(false);
  const firEditValue = ref(0);
  const firInputRef = ref<HTMLInputElement | null>(null);
  const isEditingNonFir = ref(false);
  const nonFirEditValue = ref(0);
  const nonFirInputRef = ref<HTMLInputElement | null>(null);
  const startFirEdit = () => {
    firEditValue.value = props.firCurrent;
    isEditingFir.value = true;
    nextTick(() => {
      firInputRef.value?.focus();
      firInputRef.value?.select();
    });
  };
  const submitFirEdit = () => {
    if (isEditingFir.value) {
      const value = Math.max(0, firEditValue.value || 0);
      emit('update:fir', value);
      isEditingFir.value = false;
    }
  };
  const cancelFirEdit = () => {
    isEditingFir.value = false;
  };
  const increaseFir = () => {
    emit('update:fir', props.firCurrent + 1);
  };
  const decreaseFir = () => {
    emit('update:fir', Math.max(0, props.firCurrent - 1));
  };
  const startNonFirEdit = () => {
    nonFirEditValue.value = props.nonFirCurrent;
    isEditingNonFir.value = true;
    nextTick(() => {
      nonFirInputRef.value?.focus();
      nonFirInputRef.value?.select();
    });
  };
  const submitNonFirEdit = () => {
    if (isEditingNonFir.value) {
      const value = Math.max(0, nonFirEditValue.value || 0);
      emit('update:nonFir', value);
      isEditingNonFir.value = false;
    }
  };
  const cancelNonFirEdit = () => {
    isEditingNonFir.value = false;
  };
  const increaseNonFir = () => {
    emit('update:nonFir', props.nonFirCurrent + 1);
  };
  const decreaseNonFir = () => {
    emit('update:nonFir', Math.max(0, props.nonFirCurrent - 1));
  };
  watch(
    () => props.firCurrent,
    () => {
      if (isEditingFir.value) isEditingFir.value = false;
    }
  );
  watch(
    () => props.nonFirCurrent,
    () => {
      if (isEditingNonFir.value) isEditingNonFir.value = false;
    }
  );
</script>
