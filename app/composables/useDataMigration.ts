import { markDataMigrated } from '@/plugins/store-initializer';
import DataMigrationService from '@/utils/dataMigrationService';
import { logger } from '@/utils/logger';
import type { GameMode } from '@/utils/constants';
import type { ProgressData } from '@/utils/dataMigrationService';
export type MigrationStatus = 'idle' | 'migrating' | 'success' | 'error';
export type DataMigrationComposable = {
  migrationStatus: ComputedRef<MigrationStatus>;
  migrationMessage: ComputedRef<string>;
  migrationError: ComputedRef<Error | null>;
  isMigrating: ComputedRef<boolean>;
  hasMigrated: ComputedRef<boolean>;
  hasError: ComputedRef<boolean>;
  apiToken: Ref<string>;
  showToken: Ref<boolean>;
  fetchingApi: Ref<boolean>;
  apiError: Ref<string | null>;
  apiFetchSuccess: ComputedRef<boolean>;
  importedData: Ref<ProgressData | null>;
  confirmDialog: Ref<boolean>;
  importing: Ref<boolean>;
  showObjectivesDetails: Ref<boolean>;
  showFailedTaskDetails: Ref<boolean>;
  failedTasks: ComputedRef<Array<{ id: string }>>;
  countCompletedTasks: ComputedRef<number>;
  countFailedTasks: ComputedRef<number>;
  countTaskObjectives: ComputedRef<number>;
  countHideoutModules: ComputedRef<number>;
  countHideoutParts: ComputedRef<number>;
  migrateLocalData: (userId: string) => Promise<boolean>;
  importFromApiToken: (
    apiToken: string,
    userId: string,
    targetGameMode?: GameMode
  ) => Promise<boolean>;
  fetchWithApiToken: () => Promise<boolean>;
  confirmImport: () => Promise<boolean>;
  resetMigrationState: () => void;
};
// Composable to handle data migration from localStorage or old API to Supabase
export function useDataMigration(): DataMigrationComposable {
  const { $supabase } = useNuxtApp();
  // Reactive state for migration process
  const migrationStatus = ref<MigrationStatus>('idle');
  const migrationMessage = ref('');
  const migrationError = ref<Error | null>(null);
  const isMigrating = computed(() => migrationStatus.value === 'migrating');
  const hasMigrated = computed(() => migrationStatus.value === 'success');
  const hasError = computed(() => migrationStatus.value === 'error');
  const apiToken = ref('');
  const showToken = ref(false);
  const fetchingApi = ref(false);
  const apiError = ref<string | null>(null);
  const importedData = ref<ProgressData | null>(null);
  const confirmDialog = ref(false);
  const importing = ref(false);
  const showObjectivesDetails = ref(false);
  const showFailedTaskDetails = ref(false);
  const apiFetchSuccess = computed(() => Boolean(importedData.value));
  const countCompletedTasks = computed(() => {
    const tasks = importedData.value?.taskCompletions;
    if (!tasks) return 0;
    return Object.values(tasks).filter((task) => task?.complete).length;
  });
  const countFailedTasks = computed(() => {
    const tasks = importedData.value?.taskCompletions;
    if (!tasks) return 0;
    return Object.values(tasks).filter((task) => task?.failed).length;
  });
  const countTaskObjectives = computed(() => {
    const objectives = importedData.value?.taskObjectives;
    return objectives ? Object.keys(objectives).length : 0;
  });
  const countHideoutModules = computed(() => {
    const modules = importedData.value?.hideoutModules;
    return modules ? Object.keys(modules).length : 0;
  });
  const countHideoutParts = computed(() => {
    const parts = importedData.value?.hideoutParts;
    return parts ? Object.keys(parts).length : 0;
  });
  const failedTasks = computed(() => {
    const tasks = importedData.value?.taskCompletions;
    if (!tasks) return [];
    return Object.entries(tasks)
      .filter(([, task]) => task?.failed)
      .map(([id]) => ({ id }));
  });
  /**
   * Attempts to migrate local data to the user's Supabase account
   * @param {string} userId - The authenticated user's ID
   * @returns {Promise<boolean>} - Returns true if migration was successful or not needed
   */
  const migrateLocalData = async (userId: string): Promise<boolean> => {
    if (!userId) {
      logger.warn('[useDataMigration] No user ID provided for migration');
      return false;
    }
    try {
      migrationStatus.value = 'migrating';
      migrationMessage.value = 'Checking for local data to migrate...';
      migrationError.value = null;
      // Check if there's local data to migrate
      if (!DataMigrationService.hasLocalData()) {
        migrationStatus.value = 'success';
        migrationMessage.value = 'No local data to migrate.';
        return true;
      }
      // Check if user already has data in Supabase
      const hasRemoteData = await DataMigrationService.hasUserData(userId);
      if (hasRemoteData) {
        migrationStatus.value = 'success';
        migrationMessage.value = 'User already has data in the cloud. Skipping migration.';
        // Mark as migrated locally to prevent repeated checks
        markDataMigrated();
        return true;
      }
      // Proceed with migration
      migrationMessage.value = 'Migrating your progress data...';
      const migrationSuccess = await DataMigrationService.migrateDataToUser(userId);
      if (migrationSuccess) {
        migrationStatus.value = 'success';
        migrationMessage.value = 'Your local progress has been successfully saved to the cloud!';
        // Mark as migrated to prevent repeated migrations
        markDataMigrated();
        return true;
      } else {
        throw new Error('Migration process reported failure');
      }
    } catch (error) {
      logger.error('[useDataMigration] Migration failed:', error);
      migrationStatus.value = 'error';
      migrationError.value = error as Error;
      migrationMessage.value =
        error instanceof Error ? error.message : 'An unknown error occurred during migration.';
      return false;
    }
  };
  /**
   * Imports data from an external API token to the user's account
   * @param {string} apiToken - The API token from the old system
   * @param {string} userId - The authenticated user's ID
   * @param {GameMode} targetGameMode - The game mode for the imported data
   * @returns {Promise<boolean>} - Returns true if import was successful
   */
  const importFromApiToken = async (
    apiToken: string,
    userId: string,
    targetGameMode?: GameMode
  ): Promise<boolean> => {
    if (!apiToken || !userId) {
      logger.warn('[useDataMigration] Missing API token or user ID for import');
      return false;
    }
    try {
      migrationStatus.value = 'migrating';
      migrationMessage.value = 'Fetching data from API token...';
      migrationError.value = null;
      // Fetch data using the API token
      const importedData = await DataMigrationService.fetchDataWithApiToken(apiToken);
      if (!importedData) {
        throw new Error('Failed to fetch data using the provided API token');
      }
      // Import the data to the user's Supabase account
      migrationMessage.value = 'Saving imported data to your account...';
      const importSuccess = await DataMigrationService.importDataToUser(
        userId,
        importedData,
        targetGameMode
      );
      if (importSuccess) {
        migrationStatus.value = 'success';
        migrationMessage.value = 'Data successfully imported from API token!';
        return true;
      } else {
        throw new Error('Import process reported failure');
      }
    } catch (error) {
      logger.error('[useDataMigration] Import failed:', error);
      migrationStatus.value = 'error';
      migrationError.value = error as Error;
      migrationMessage.value =
        error instanceof Error ? error.message : 'An unknown error occurred during import.';
      return false;
    }
  };
  const fetchWithApiToken = async (): Promise<boolean> => {
    if (fetchingApi.value) return false;
    apiError.value = null;
    importedData.value = null;
    confirmDialog.value = false;
    showObjectivesDetails.value = false;
    showFailedTaskDetails.value = false;
    const token = apiToken.value.trim();
    if (!token) {
      apiError.value = 'API token is required.';
      logger.warn('[useDataMigration] Missing API token for fetch');
      return false;
    }
    fetchingApi.value = true;
    try {
      const data = await DataMigrationService.fetchDataWithApiToken(token);
      if (!data) {
        apiError.value = 'Failed to fetch data with the provided API token.';
        logger.warn('[useDataMigration] API token fetch returned no data');
        return false;
      }
      importedData.value = data;
      confirmDialog.value = true;
      return true;
    } catch (error) {
      logger.error('[useDataMigration] API token fetch failed:', error);
      apiError.value = error instanceof Error ? error.message : 'An unknown error occurred.';
      return false;
    } finally {
      fetchingApi.value = false;
    }
  };
  const confirmImport = async (): Promise<boolean> => {
    if (importing.value) return false;
    apiError.value = null;
    const data = importedData.value;
    if (!data) {
      apiError.value = 'No data available to import.';
      logger.warn('[useDataMigration] No imported data to confirm');
      return false;
    }
    if (!$supabase.user) {
      apiError.value = 'Please sign in to import data.';
      logger.warn('[useDataMigration] Missing user object for import');
      return false;
    }
    if (!$supabase.user.id) {
      apiError.value = 'User session invalid, please re-authenticate.';
      logger.warn('[useDataMigration] Missing user ID for import');
      return false;
    }
    const userId = $supabase.user.id;
    importing.value = true;
    try {
      migrationStatus.value = 'migrating';
      migrationMessage.value = 'Saving imported data to your account...';
      migrationError.value = null;
      const importSuccess = await DataMigrationService.importDataToUser(userId, data);
      if (importSuccess) {
        migrationStatus.value = 'success';
        migrationMessage.value = 'Data successfully imported from API token!';
        confirmDialog.value = false;
        return true;
      }
      throw new Error('Import process reported failure');
    } catch (error) {
      logger.error('[useDataMigration] Confirm import failed:', error);
      migrationStatus.value = 'error';
      migrationError.value = error as Error;
      migrationMessage.value =
        error instanceof Error ? error.message : 'An unknown error occurred during import.';
      apiError.value = migrationMessage.value;
      return false;
    } finally {
      importing.value = false;
    }
  };
  /**
   * Resets the migration state to idle
   */
  const resetMigrationState = () => {
    migrationStatus.value = 'idle';
    migrationMessage.value = '';
    migrationError.value = null;
    apiError.value = null;
    apiToken.value = '';
    showToken.value = false;
    fetchingApi.value = false;
    importedData.value = null;
    confirmDialog.value = false;
    importing.value = false;
    showObjectivesDetails.value = false;
    showFailedTaskDetails.value = false;
  };
  return {
    // State
    migrationStatus: computed(() => migrationStatus.value),
    migrationMessage: computed(() => migrationMessage.value),
    migrationError: computed(() => migrationError.value),
    isMigrating,
    hasMigrated,
    hasError,
    apiToken,
    showToken,
    fetchingApi,
    apiError,
    apiFetchSuccess,
    importedData,
    confirmDialog,
    importing,
    showObjectivesDetails,
    showFailedTaskDetails,
    failedTasks,
    countCompletedTasks,
    countFailedTasks,
    countTaskObjectives,
    countHideoutModules,
    countHideoutParts,
    // Actions
    migrateLocalData,
    importFromApiToken,
    fetchWithApiToken,
    confirmImport,
    resetMigrationState,
  };
}
