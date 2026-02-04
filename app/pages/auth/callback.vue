<template>
  <div class="bg-surface-900 flex min-h-screen items-center justify-center px-4">
    <UCard
      class="bg-surface-900 w-full max-w-md border border-white/10 shadow-2xl"
      :ui="{ body: 'p-8' }"
    >
      <div class="flex flex-col items-center space-y-3 text-center">
        <UIcon name="i-heroicons-arrow-path" class="text-primary-500 h-10 w-10 animate-spin" />
        <h2 class="text-surface-50 text-lg font-semibold">Authenticating...</h2>
        <p class="text-surface-300 text-sm">Please wait while we complete your sign in.</p>
      </div>
    </UCard>
  </div>
</template>
<script setup lang="ts">
  import { logger } from '@/utils/logger';
  const route = useRoute();
  onMounted(async () => {
    // Check if this is a popup window (has opener)
    const isPopup = window.opener && !window.opener.closed;
    if (isPopup) {
      // Wait for Supabase to process the OAuth hash
      // The Supabase client automatically processes the hash on page load
      // We just need to wait a moment for it to complete
      await new Promise((resolve) => setTimeout(resolve, 500));
      // Send success message to opener window
      window.opener.postMessage({ type: 'OAUTH_SUCCESS' }, window.location.origin);
      // Close this popup after a short delay to ensure the message is sent
      setTimeout(() => {
        window.close();
      }, 200);
    } else {
      // This is a full redirect (not popup) - redirect to original page or dashboard
      // Wait a moment for the session to be established
      await new Promise((resolve) => setTimeout(resolve, 500));
      const redirectParam = route.query.redirect;
      const redirectValue = Array.isArray(redirectParam) ? redirectParam[0] : redirectParam;
      const redirectRaw = typeof redirectValue === 'string' ? redirectValue.trim() : '';
      const isSafeRedirect =
        redirectRaw.length > 0 &&
        redirectRaw.startsWith('/') &&
        !redirectRaw.startsWith('//') &&
        !/https?:/i.test(redirectRaw) &&
        !/^[a-z][a-z0-9+.-]*:/i.test(redirectRaw);
      const redirect = isSafeRedirect ? redirectRaw : '/';
      try {
        await navigateTo(redirect, { replace: true });
      } catch (error) {
        logger.error('[AuthCallback] Navigation failed:', error);
        await navigateTo('/', { replace: true });
      }
    }
  });
</script>
