import { defineStore } from "pinia";
import {
  getters,
  actions,
  defaultState,
  migrateToGameModeStructure,
  type UserState,
  type UserActions,
  type GameMode,
} from "@/shared_state";
import { useSupabaseSync } from "@/composables/supabase/useSupabaseSync";

// Define the store, letting Pinia infer the type
export const useTarkovStore = defineStore("swapTarkov", {
  state: () => {
    // Start with default state
    return JSON.parse(JSON.stringify(defaultState)) as UserState;
  },
  getters: {
    ...getters,
    // Override getters to trigger migration before data access
    isTaskComplete: function (state) {
      return (taskId: string) => {
        (
          this as unknown as { migrateDataIfNeeded: () => void }
        ).migrateDataIfNeeded();
        return getters.isTaskComplete(state)(taskId);
      };
    },
    isTaskFailed: function (state) {
      return (taskId: string) => {
        (
          this as unknown as { migrateDataIfNeeded: () => void }
        ).migrateDataIfNeeded();
        return getters.isTaskFailed(state)(taskId);
      };
    },
    getCurrentGameMode: function (state) {
      return () => {
        (
          this as unknown as { migrateDataIfNeeded: () => void }
        ).migrateDataIfNeeded();
        return getters.getCurrentGameMode(state)();
      };
    },
  },
  actions: {
    ...(actions as UserActions),
    async switchGameMode(mode: GameMode) {
      // Switch the current game mode using the base action
      actions.switchGameMode.call(this, mode);

      // If user is logged in, sync the gamemode change to backend
      const { $supabase } = useNuxtApp();
      if ($supabase.user.loggedIn && $supabase.user.id) {
        try {
          // Send complete state to Supabase
          const completeState = {
            user_id: $supabase.user.id,
            current_game_mode: mode,
            game_edition: this.gameEdition,
            pvp_data: this.pvp,
            pve_data: this.pve,
          };

          await $supabase.client.from("user_progress").upsert(completeState);
        } catch (error) {
          console.error("Error syncing gamemode to backend:", error);
        }
      }
    },
    migrateDataIfNeeded() {
      // Check if we need to migrate data
      const needsMigration =
        !this.currentGameMode ||
        !this.pvp ||
        !this.pve ||
        ((this as unknown as Record<string, unknown>).level !== undefined &&
          !this.pvp?.level);

      if (needsMigration) {
        console.log(
          "Migrating legacy data structure to gamemode-aware structure"
        );
        const currentState = JSON.parse(JSON.stringify(this.$state));
        const migratedData = migrateToGameModeStructure(currentState);
        this.$patch(migratedData);

        // If user is logged in, save the migrated structure to Supabase
        const { $supabase } = useNuxtApp();
        if ($supabase.user.loggedIn && $supabase.user.id) {
          try {
            $supabase.client.from("user_progress").upsert({
              user_id: $supabase.user.id,
              current_game_mode: migratedData.currentGameMode,
              game_edition: migratedData.gameEdition,
              pvp_data: migratedData.pvp,
              pve_data: migratedData.pve,
            });
          } catch (error) {
            console.error("Error saving migrated data to Supabase:", error);
          }
        }
      }
    },
    async resetOnlineProfile() {
      const { $supabase } = useNuxtApp();
      if (!$supabase.user.loggedIn || !$supabase.user.id) {
        console.error("User not logged in. Cannot reset online profile.");
        return;
      }

      try {
        // Set the Supabase record to a fresh defaultState
        const freshDefaultState = JSON.parse(JSON.stringify(defaultState));
        await $supabase.client.from("user_progress").upsert({
          user_id: $supabase.user.id,
          current_game_mode: freshDefaultState.currentGameMode,
          game_edition: freshDefaultState.gameEdition,
          pvp_data: freshDefaultState.pvp,
          pve_data: freshDefaultState.pve,
        });

        // Clear ALL localStorage data for full account reset
        localStorage.clear();

        // Reset the local Pinia store state to default using $patch
        this.$patch(JSON.parse(JSON.stringify(defaultState)));
      } catch (error) {
        console.error("Error resetting online profile:", error);
      }
    },
    async resetCurrentGameModeData() {
      const { $supabase } = useNuxtApp();
      if (!$supabase.user.loggedIn || !$supabase.user.id) {
        console.error("User not logged in. Cannot reset game mode data.");
        return;
      }

      const currentMode = this.getCurrentGameMode();

      try {
        // Create fresh default progress data for the current game mode
        const freshProgressData = JSON.parse(
          JSON.stringify(defaultState[currentMode])
        );

        // Update only the current game mode data in Supabase
        const updateData: Record<string, unknown> = {
          user_id: $supabase.user.id,
        };

        if (currentMode === "pvp") {
          updateData.pvp_data = freshProgressData;
        } else {
          updateData.pve_data = freshProgressData;
        }

        await $supabase.client.from("user_progress").upsert(updateData);

        // Clear ALL localStorage data for gamemode reset
        localStorage.clear();

        // Reset only the current game mode data in the local store
        this.$patch({ [currentMode]: freshProgressData });
      } catch (error) {
        console.error(`Error resetting ${currentMode} game mode data:`, error);
      }
    },
  },
});

// Legacy initialization removed - handled by initializeTarkovSync in app.vue

/**
 * Initialize Supabase sync for tarkov store
 */
export function initializeTarkovSync() {
  const tarkovStore = useTarkovStore();
  const { $supabase } = useNuxtApp();

  if (import.meta.client && $supabase.user.loggedIn) {
    console.log("[TarkovStore] Setting up Supabase sync and listener");

    let isInitialLoad = true;

    // Load initial data from Supabase
    const loadData = async () => {
      const { data, error } = await $supabase.client
        .from("user_progress")
        .select("*")
        .eq("user_id", $supabase.user.id)
        .single();

      if (error) {
        console.error("[TarkovStore] Error loading data:", error);
        isInitialLoad = false;
        return;
      }

      if (data) {
        console.log("[TarkovStore] Loading data from Supabase:", data);
        tarkovStore.$patch({
          currentGameMode: data.current_game_mode || "pvp",
          gameEdition: data.game_edition || 1,
          pvp: data.pvp_data || {},
          pve: data.pve_data || {},
        });

        // Mark initial load complete after a short delay
        setTimeout(() => {
          isInitialLoad = false;
          console.log("[TarkovStore] Initial load complete, sync enabled");
        }, 500);
      } else {
        isInitialLoad = false;
      }
    };

    // Load data immediately
    loadData();

    // Setup sync to save changes (but skip during initial load)
    useSupabaseSync({
      store: tarkovStore,
      table: "user_progress",
      debounceMs: 250,
      transform: (state: unknown) => {
        const userState = state as UserState;

        // Skip sync during initial load
        if (isInitialLoad) {
          console.log("[TarkovStore] Skipping sync during initial load");
          return undefined as unknown as Record<string, unknown>; // Return null to skip sync
        }

        return {
          user_id: $supabase.user.id,
          current_game_mode: userState.currentGameMode || "pvp",
          game_edition:
            typeof userState.gameEdition === "string"
              ? parseInt(userState.gameEdition)
              : userState.gameEdition,
          pvp_data: userState.pvp || {},
          pve_data: userState.pve || {},
        };
      },
    });
  }
}
