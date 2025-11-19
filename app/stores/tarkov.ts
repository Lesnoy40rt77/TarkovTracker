import { defineStore } from "pinia";
import {
  getters,
  actions,
  defaultState,
  migrateToGameModeStructure,
  type UserState,
  type UserActions,
} from "@/shared_state";
import { GAME_MODES, type GameMode } from "@/utils/constants";
import { useSupabaseSync } from "@/composables/supabase/useSupabaseSync";
export const useTarkovStore = defineStore("swapTarkov", {
  state: () => {
    return JSON.parse(JSON.stringify(defaultState)) as UserState;
  },
  getters: {
    ...getters,
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
      actions.switchGameMode.call(this, mode);
      const { $supabase } = useNuxtApp();
      if ($supabase.user.loggedIn && $supabase.user.id) {
        try {
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
        const freshDefaultState = JSON.parse(JSON.stringify(defaultState));
        await $supabase.client.from("user_progress").upsert({
          user_id: $supabase.user.id,
          current_game_mode: freshDefaultState.currentGameMode,
          game_edition: freshDefaultState.gameEdition,
          pvp_data: freshDefaultState.pvp,
          pve_data: freshDefaultState.pve,
        });
        localStorage.clear();
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
        const freshProgressData = JSON.parse(
          JSON.stringify(defaultState[currentMode])
        );
        const updateData: Record<string, unknown> = {
          user_id: $supabase.user.id,
        };
        if (currentMode === GAME_MODES.PVP) {
          updateData.pvp_data = freshProgressData;
        } else {
          updateData.pve_data = freshProgressData;
        }
        await $supabase.client.from("user_progress").upsert(updateData);
        localStorage.clear();
        this.$patch({ [currentMode]: freshProgressData });
      } catch (error) {
        console.error(`Error resetting ${currentMode} game mode data:`, error);
      }
    },
  },
});
export function initializeTarkovSync() {
  const tarkovStore = useTarkovStore();
  const { $supabase } = useNuxtApp();
  if (import.meta.client && $supabase.user.loggedIn) {
    console.log("[TarkovStore] Setting up Supabase sync and listener");
    let isInitialLoad = true;
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
          currentGameMode: data.current_game_mode || GAME_MODES.PVP,
          gameEdition: data.game_edition || 1,
          pvp: data.pvp_data || {},
          pve: data.pve_data || {},
        });
        setTimeout(() => {
          isInitialLoad = false;
          console.log("[TarkovStore] Initial load complete, sync enabled");
        }, 500);
      } else {
        isInitialLoad = false;
      }
    };
    loadData();
    useSupabaseSync({
      store: tarkovStore,
      table: "user_progress",
      debounceMs: 250,
      transform: (state: unknown) => {
        const userState = state as UserState;
        if (isInitialLoad) {
          console.log("[TarkovStore] Skipping sync during initial load");
          return undefined as unknown as Record<string, unknown>; // Return null to skip sync
        }
        return {
          user_id: $supabase.user.id,
          current_game_mode: userState.currentGameMode || GAME_MODES.PVP,
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
