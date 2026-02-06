<script setup lang="ts">
  import { logger } from '@/utils/logger';
  definePageMeta({
    layout: 'default',
  });
  const route = useRoute();
  const { client: supabase } = useNuxtApp().$supabase;
  const authorizationId = computed(() => {
    const value = route.query.authorization_id;
    return typeof value === 'string' ? value : '';
  });
  const loading = ref(true);
  const error = ref('');
  const details = ref<{
    user?: { id: string; email: string };
    scope?: string;
    authorization_id: string;
    redirect_url?: string;
    client?: { id: string; name: string; uri?: string; logo_uri?: string };
  } | null>(null);
  onMounted(async () => {
    if (!authorizationId.value) {
      error.value = 'Missing authorization_id parameter';
      loading.value = false;
      return;
    }
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        await navigateTo({ path: '/login', query: { redirect: route.fullPath } });
        return;
      }
      const { data, error: fetchError } = await supabase.auth.oauth.getAuthorizationDetails(
        authorizationId.value
      );
      if (import.meta.dev) {
        const sanitized = {
          client_id: data?.client?.id,
          client_name: data?.client?.name,
          scope: data?.scope,
          prompt: (data as Record<string, unknown>)?.prompt,
          authorization_id: data?.authorization_id,
        };
        logger.debug('[OAuth] Authorization details:', JSON.stringify(sanitized, null, 2));
      }
      if (fetchError) {
        if (fetchError.message?.includes('cannot be processed')) {
          error.value = 'This authorization request has expired or was already processed.';
        } else {
          throw fetchError;
        }
        return;
      }
      if (data?.redirect_url) {
        logger.info('[OAuth] Auto-redirecting to:', data.redirect_url);
        window.location.href = data.redirect_url;
        return;
      }
      details.value = data;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch authorization details';
    } finally {
      loading.value = false;
    }
  });
  async function approve() {
    loading.value = true;
    error.value = '';
    try {
      logger.info('[OAuth] Approving authorization:', authorizationId.value);
      const { data, error: approveError } = await supabase.auth.oauth.approveAuthorization(
        authorizationId.value
      );
      logger.debug('[OAuth] Approve result:', { data, error: approveError });
      if (approveError) throw approveError;
      if (data?.redirect_url) {
        logger.info('[OAuth] Redirecting to:', data.redirect_url);
        window.location.href = data.redirect_url;
      } else {
        throw new Error('No redirect URL returned');
      }
    } catch (e) {
      logger.error('[OAuth] Approve error:', e);
      error.value = e instanceof Error ? e.message : 'Failed to approve authorization';
      loading.value = false;
    }
  }
  async function deny() {
    loading.value = true;
    error.value = '';
    try {
      logger.info('[OAuth] Deny authorization start:', authorizationId.value);
      const { data, error: denyError } = await supabase.auth.oauth.denyAuthorization(
        authorizationId.value
      );
      logger.debug('[OAuth] Deny result:', { data, error: denyError });
      if (denyError) throw denyError;
      if (data?.redirect_url) {
        logger.info('[OAuth] Redirecting after deny to:', data.redirect_url);
        window.location.href = data.redirect_url;
      } else {
        throw new Error('No redirect URL returned');
      }
    } catch (e) {
      logger.error('[OAuth] Deny error:', e);
      error.value = e instanceof Error ? e.message : 'Failed to deny authorization';
      loading.value = false;
    }
  }
  useSeoMeta({
    title: 'OAuth Consent - TarkovTracker',
    robots: 'noindex, nofollow',
  });
</script>
<template>
  <div class="bg-surface-1 flex min-h-screen items-center justify-center p-4">
    <div class="bg-surface-2 w-full max-w-md rounded-lg p-6 shadow-lg">
      <h1 class="text-text-primary mb-6 text-2xl font-bold">Authorize Application</h1>
      <div v-if="loading" class="py-8 text-center">
        <div
          class="border-accent-primary inline-block h-8 w-8 animate-spin rounded-full border-b-2"
        ></div>
        <p class="text-text-secondary mt-4">Loading...</p>
      </div>
      <div v-else-if="error" class="border-error bg-error-surface mb-4 rounded border p-4">
        <p class="text-error text-sm">{{ error }}</p>
      </div>
      <div v-else-if="details">
        <div class="mb-6">
          <p class="text-text-secondary mb-4">
            <strong class="text-text-primary">
              {{ details.client?.name || 'Unknown Application' }}
            </strong>
            is requesting access to your TarkovTracker account.
          </p>
          <div v-if="details.scope" class="bg-surface-3 mb-4 rounded p-4">
            <h3 class="text-text-primary mb-2 font-semibold">Requested Permissions:</h3>
            <ul class="list-inside list-disc space-y-1">
              <li
                v-for="scope in details.scope?.split(' ') || []"
                :key="scope"
                class="text-text-secondary text-sm"
              >
                {{ scope }}
              </li>
            </ul>
          </div>
          <p v-if="details.redirect_url" class="text-text-tertiary mb-4 text-xs">
            Will redirect to:
            <span class="font-mono">{{ details.redirect_url }}</span>
          </p>
        </div>
        <div class="flex gap-3">
          <button
            :disabled="loading"
            class="bg-accent-primary hover:bg-accent-primary-hover flex-1 rounded px-4 py-2 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
            @click="approve"
          >
            Approve
          </button>
          <button
            :disabled="loading"
            class="bg-surface-3 text-text-primary hover:bg-surface-4 flex-1 rounded px-4 py-2 font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
            @click="deny"
          >
            Deny
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
