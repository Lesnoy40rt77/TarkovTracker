<template>
  <input
    v-if="hasReputation"
    type="text"
    inputmode="decimal"
    :value="reputationInput"
    placeholder="0.00"
    :title="resolvedTitle"
    :aria-label="resolvedTitle"
    class="bg-surface-800 border-surface-700 text-surface-100 placeholder-surface-500 focus:border-surface-600 focus:ring-primary-500/30 h-7 w-16 rounded border px-1.5 text-center text-sm tabular-nums transition-colors focus:ring-1 focus:outline-none"
    @blur="emit('blur', $event)"
    @focus="emit('focus', $event)"
    @input="emit('input', $event)"
    @keydown="emit('keydown', $event)"
  />
</template>
<script setup lang="ts">
  const { t } = useI18n();
  const props = defineProps<{
    hasReputation: boolean;
    reputationInput: string;
    title?: string;
  }>();
  const resolvedTitle = computed(
    () => props.title ?? t('page.dashboard.traders.reputation_input_label')
  );
  const emit = defineEmits<{
    blur: [FocusEvent];
    focus: [FocusEvent];
    input: [Event];
    keydown: [KeyboardEvent];
  }>();
</script>
