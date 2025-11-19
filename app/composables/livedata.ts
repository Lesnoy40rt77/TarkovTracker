import {
  useTeammateStores,
  useTeamStoreWithFirebase,
} from "@/stores/useTeamStore";
import { useSystemStoreWithFirebase } from "@/stores/useSystemStore";
import { useProgressStoreWithSupabase } from "@/stores/progress";
import { useTarkovStore } from "@/stores/tarkov";
// Legacy support - the actual implementation is now in the modular composables
// This maintains backward compatibility while using the new structure
let globalTeammateStores: ReturnType<typeof useTeammateStores> | null = null;
function initializeGlobalState() {
  if (!globalTeammateStores) {
    globalTeammateStores = useTeammateStores();
  }
}
export const teammateStores = globalTeammateStores;
let tarkovStore: ReturnType<typeof useTarkovStore> | null = null;
const getTarkovStore = () => {
  if (!tarkovStore) {
    tarkovStore = useTarkovStore();
  }
  return tarkovStore;
};
/**
 * Main composable that provides backward compatibility
 * while using the new modular structure under the hood
 */
export function useLiveData() {
  initializeGlobalState();
  return {
    useTeamStore: useTeamStoreWithFirebase,
    useSystemStore: useSystemStoreWithFirebase,
    useProgressStore: useProgressStoreWithSupabase,
    teammateStores: globalTeammateStores?.teammateStores,
    tarkovStore: getTarkovStore(),
  };
}
