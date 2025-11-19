import { ref, watch } from "vue";
import type { Store } from "pinia";
import { debounce } from "@/utils/debounce";
export interface SupabaseSyncConfig {
  store: Store;
  table: string;
  transform?: (state: Record<string, unknown>) => Record<string, unknown>;
  debounceMs?: number;
}
export function useSupabaseSync({
  store,
  table,
  transform,
  debounceMs = 1000,
}: SupabaseSyncConfig) {
  console.log(
    `[Sync] useSupabaseSync initialized for table: ${table}, debounce: ${debounceMs}ms`
  );
  const { $supabase } = useNuxtApp();
  const isSyncing = ref(false);
  const syncToSupabase = async (state: Record<string, unknown>) => {
    console.log("[Sync] syncToSupabase called", {
      loggedIn: $supabase.user.loggedIn,
      userId: $supabase.user.id,
    });
    if (!$supabase.user.loggedIn || !$supabase.user.id) {
      console.log("[Sync] Skipping - user not logged in");
      return;
    }
    isSyncing.value = true;
    try {
      const dataToSave = transform ? transform(state) : state;
      // Skip if transform returned null (e.g., during initial load)
      if (!dataToSave) {
        console.log("[Sync] Skipping - transform returned null");
        isSyncing.value = false;
        return;
      }
      // Ensure user_id is present if not already
      if (!dataToSave.user_id) {
        dataToSave.user_id = $supabase.user.id;
      }
      // Don't add last_updated - table has updated_at with trigger
      console.log("[Sync] About to upsert to", table, dataToSave);
      const { error } = await $supabase.client.from(table).upsert(dataToSave);
      if (error) {
        console.error(`[Sync] Error syncing to ${table}:`, error);
      } else {
        console.log(`[Sync] ✅ Successfully synced to ${table}`);
      }
    } catch (err) {
      console.error(`[Sync] Unexpected error:`, err);
    } finally {
      isSyncing.value = false;
    }
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const debouncedSync = debounce(syncToSupabase as any, debounceMs);
  watch(
    () => store.$state,
    (newState) => {
      console.log(
        `[Sync] Store state changed for ${table}, triggering debounced sync`
      );
      debouncedSync(JSON.parse(JSON.stringify(newState)));
    },
    { deep: true }
  );
  return {
    isSyncing,
  };
}
