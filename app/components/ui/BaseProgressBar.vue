<template>
  <div class="bg-surface-800/35 h-2 overflow-hidden rounded-full" :class="trackClass">
    <div
      class="h-full rounded-full transition-[width] duration-300 ease-out"
      :class="fillColorClass"
      :style="{ width: `${clampedValue}%` }"
      role="progressbar"
      :aria-label="ariaLabel"
      :aria-valuenow="clampedValue"
      aria-valuemin="0"
      aria-valuemax="100"
    ></div>
  </div>
</template>
<script setup lang="ts">
  export type ProgressBarColor =
    | 'primary'
    | 'neutral'
    | 'info'
    | 'success'
    | 'kappa'
    | 'lightkeeper';
  const props = withDefaults(
    defineProps<{
      value: number;
      color?: ProgressBarColor;
      ariaLabel?: string;
      trackClass?: string;
    }>(),
    {
      color: 'primary',
      ariaLabel: 'Progress',
      trackClass: '',
    }
  );
  const clampedValue = computed(() => Math.max(0, Math.min(100, props.value)));
  const fillColors: Record<ProgressBarColor, string> = {
    primary: 'bg-primary-500/60',
    neutral: 'bg-surface-400/60',
    info: 'bg-info-500/60',
    success: 'bg-success-500/60',
    kappa: 'bg-kappa-500/60',
    lightkeeper: 'bg-lightkeeper-500/60',
  };
  const fillColorClass = computed(() => fillColors[props.color]);
</script>
