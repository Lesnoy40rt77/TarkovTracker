<template>
  <div
    class="bg-surface-950 flex min-h-screen flex-col items-center justify-center px-4 py-10 text-center"
  >
    <div
      class="bg-surface-900 border-surface-700/60 w-full max-w-xl rounded-2xl border px-6 py-8 shadow-2xl"
    >
      <UIcon name="i-mdi-alert-circle-outline" class="text-warning-400 mx-auto h-16 w-16" />
      <h1 class="text-surface-50 mt-4 text-3xl font-semibold sm:text-4xl">
        {{ errorTitle }}
      </h1>
      <p class="text-surface-300 mt-3 text-sm sm:text-base">
        {{ errorDescription }}
      </p>
      <div class="mt-6 flex justify-center">
        <UButton
          size="lg"
          color="primary"
          variant="solid"
          icon="i-mdi-home"
          class="px-6"
          @click="handleError"
        >
          Return Home
        </UButton>
      </div>
      <p class="text-surface-500 mt-6 text-xs">Error {{ error.statusCode }}::{{ error.message }}</p>
    </div>
  </div>
</template>
<script setup lang="ts">
  import type { NuxtError } from '#app';
  const props = defineProps({
    error: {
      type: Object as () => NuxtError,
      required: true,
    },
  });
  const handleError = () => clearError({ redirect: '/' });
  const errorTitle = computed(() =>
    props.error.statusCode === 404 ? 'Page Not Found' : 'Something Went Wrong'
  );
  const errorDescription = computed(() =>
    props.error.statusCode === 404
      ? 'The page you are looking for does not exist.'
      : 'An unexpected error occurred while processing your request.'
  );
</script>
