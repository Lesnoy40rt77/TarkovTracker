import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { ref } from 'vue';
import type { LeafletMapRef } from '@/composables/useMapObjectivePopup';
const createMetadataStore = (
  objectives: Array<{
    id: string;
    taskId?: string;
    zones?: Array<{ map?: { id?: string } }>;
    possibleLocations?: Array<{ map?: { id?: string } }>;
  }> = [],
  objectiveMaps: Record<string, Array<{ objectiveID: string; mapID: string }>> = {}
) => ({
  objectives,
  objectiveMaps,
});
const createPreferencesStore = (mapView = 'customs') => ({
  getTaskMapView: mapView,
  setTaskMapView: vi.fn(),
});
const mockSetup = (options?: {
  objectives?: Parameters<typeof createMetadataStore>[0];
  objectiveMaps?: Parameters<typeof createMetadataStore>[1];
  mapView?: string;
  activateResult?: boolean | (() => boolean);
}) => {
  const metadataStore = createMetadataStore(
    options?.objectives ?? [],
    options?.objectiveMaps ?? {}
  );
  const preferencesStore = createPreferencesStore(options?.mapView ?? 'customs');
  vi.doMock('@/stores/useMetadata', () => ({
    useMetadataStore: () => metadataStore,
  }));
  vi.doMock('@/stores/usePreferences', () => ({
    usePreferencesStore: () => preferencesStore,
  }));
  vi.doMock('@/utils/logger', () => ({
    logger: { warn: vi.fn(), error: vi.fn(), debug: vi.fn(), info: vi.fn() },
  }));
  const rawResult = options?.activateResult;
  const activateResultFn: (id: string) => boolean =
    typeof rawResult === 'function' ? rawResult : () => rawResult ?? false;
  const activateObjectivePopup = vi.fn<(id: string) => boolean>(activateResultFn);
  const closeActivePopup = vi.fn();
  const leafletMapRef = ref<LeafletMapRef | null>({
    activateObjectivePopup,
    closeActivePopup,
  });
  const mapContainerRef = ref<HTMLElement | null>(document.createElement('div'));
  return { leafletMapRef, mapContainerRef, activateObjectivePopup, preferencesStore };
};
describe('useMapObjectivePopup', () => {
  beforeEach(() => {
    vi.resetModules();
  });
  describe('activateObjectivePopupWithRetry (via jumpToMapObjective)', () => {
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: false });
    });
    afterEach(() => {
      vi.useRealTimers();
    });
    it('stops retrying on first success', async () => {
      const mocks = mockSetup({
        objectives: [{ id: 'obj-1', taskId: 'task-1' }],
        objectiveMaps: { 'task-1': [{ objectiveID: 'obj-1', mapID: 'customs' }] },
        activateResult: true,
      });
      const { useMapObjectivePopup } = await import('@/composables/useMapObjectivePopup');
      const result = useMapObjectivePopup({
        leafletMapRef: mocks.leafletMapRef,
        mapContainerRef: mocks.mapContainerRef,
      });
      result.jumpToMapObjective('obj-1');
      expect(mocks.activateObjectivePopup).toHaveBeenCalledTimes(1);
      expect(mocks.activateObjectivePopup).toHaveBeenCalledWith('obj-1');
      await vi.advanceTimersByTimeAsync(1000);
      expect(mocks.activateObjectivePopup).toHaveBeenCalledTimes(1);
      result.cleanup();
    });
    it('stops retrying after max attempts and warns', async () => {
      const mocks = mockSetup({
        objectives: [{ id: 'obj-1', taskId: 'task-1' }],
        objectiveMaps: { 'task-1': [{ objectiveID: 'obj-1', mapID: 'customs' }] },
        activateResult: false,
      });
      const { useMapObjectivePopup } = await import('@/composables/useMapObjectivePopup');
      const result = useMapObjectivePopup({
        leafletMapRef: mocks.leafletMapRef,
        mapContainerRef: mocks.mapContainerRef,
      });
      result.jumpToMapObjective('obj-1');
      expect(mocks.activateObjectivePopup).toHaveBeenCalledTimes(1);
      for (let i = 0; i < 10; i++) {
        await vi.advanceTimersByTimeAsync(150);
      }
      expect(mocks.activateObjectivePopup).toHaveBeenCalledTimes(6);
      const { logger } = await import('@/utils/logger');
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Failed to activate popup for objective obj-1 after 6 attempts')
      );
      result.cleanup();
    });
    it('retries until success within max attempts', async () => {
      let callCount = 0;
      const mocks = mockSetup({
        objectives: [{ id: 'obj-2', taskId: 'task-1' }],
        objectiveMaps: { 'task-1': [{ objectiveID: 'obj-2', mapID: 'customs' }] },
        activateResult: () => {
          callCount++;
          return callCount >= 3;
        },
      });
      const { useMapObjectivePopup } = await import('@/composables/useMapObjectivePopup');
      const result = useMapObjectivePopup({
        leafletMapRef: mocks.leafletMapRef,
        mapContainerRef: mocks.mapContainerRef,
      });
      result.jumpToMapObjective('obj-2');
      expect(mocks.activateObjectivePopup).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(150);
      expect(mocks.activateObjectivePopup).toHaveBeenCalledTimes(2);
      await vi.advanceTimersByTimeAsync(150);
      expect(mocks.activateObjectivePopup).toHaveBeenCalledTimes(3);
      await vi.advanceTimersByTimeAsync(500);
      expect(mocks.activateObjectivePopup).toHaveBeenCalledTimes(3);
      result.cleanup();
    });
    it('clears all pending timers on cleanup', async () => {
      const mocks = mockSetup({
        objectives: [{ id: 'obj-1', taskId: 'task-1' }],
        objectiveMaps: { 'task-1': [{ objectiveID: 'obj-1', mapID: 'customs' }] },
        activateResult: false,
      });
      const { useMapObjectivePopup } = await import('@/composables/useMapObjectivePopup');
      const result = useMapObjectivePopup({
        leafletMapRef: mocks.leafletMapRef,
        mapContainerRef: mocks.mapContainerRef,
      });
      result.jumpToMapObjective('obj-1');
      expect(mocks.activateObjectivePopup).toHaveBeenCalledTimes(1);
      result.cleanup();
      await vi.advanceTimersByTimeAsync(1500);
      expect(mocks.activateObjectivePopup).toHaveBeenCalledTimes(1);
    });
  });
  describe('jumpToMapObjective map resolution', () => {
    it('switches map when objective is on a different map', async () => {
      const mocks = mockSetup({
        objectives: [{ id: 'obj-1', taskId: 'task-1' }],
        objectiveMaps: { 'task-1': [{ objectiveID: 'obj-1', mapID: 'woods' }] },
        mapView: 'customs',
        activateResult: true,
      });
      const { useMapObjectivePopup } = await import('@/composables/useMapObjectivePopup');
      const result = useMapObjectivePopup({
        leafletMapRef: mocks.leafletMapRef,
        mapContainerRef: mocks.mapContainerRef,
      });
      await result.jumpToMapObjective('obj-1');
      expect(mocks.preferencesStore.setTaskMapView).toHaveBeenCalledWith('woods');
      result.cleanup();
    });
    it('does not switch map when objective is on the current map', async () => {
      const mocks = mockSetup({
        objectives: [{ id: 'obj-1', taskId: 'task-1' }],
        objectiveMaps: { 'task-1': [{ objectiveID: 'obj-1', mapID: 'customs' }] },
        mapView: 'customs',
        activateResult: true,
      });
      const { useMapObjectivePopup } = await import('@/composables/useMapObjectivePopup');
      const result = useMapObjectivePopup({
        leafletMapRef: mocks.leafletMapRef,
        mapContainerRef: mocks.mapContainerRef,
      });
      await result.jumpToMapObjective('obj-1');
      expect(mocks.preferencesStore.setTaskMapView).not.toHaveBeenCalled();
      result.cleanup();
    });
    it('uses zone map ID when available', async () => {
      const mocks = mockSetup({
        objectives: [{ id: 'obj-z', taskId: 'task-1', zones: [{ map: { id: 'factory' } }] }],
        mapView: 'customs',
        activateResult: true,
      });
      const { useMapObjectivePopup } = await import('@/composables/useMapObjectivePopup');
      const result = useMapObjectivePopup({
        leafletMapRef: mocks.leafletMapRef,
        mapContainerRef: mocks.mapContainerRef,
      });
      await result.jumpToMapObjective('obj-z');
      expect(mocks.preferencesStore.setTaskMapView).toHaveBeenCalledWith('factory');
      result.cleanup();
    });
    it('uses possibleLocations map ID as fallback', async () => {
      const mocks = mockSetup({
        objectives: [
          {
            id: 'obj-p',
            taskId: 'task-1',
            zones: [],
            possibleLocations: [{ map: { id: 'interchange' } }],
          },
        ],
        mapView: 'customs',
        activateResult: true,
      });
      const { useMapObjectivePopup } = await import('@/composables/useMapObjectivePopup');
      const result = useMapObjectivePopup({
        leafletMapRef: mocks.leafletMapRef,
        mapContainerRef: mocks.mapContainerRef,
      });
      await result.jumpToMapObjective('obj-p');
      expect(mocks.preferencesStore.setTaskMapView).toHaveBeenCalledWith('interchange');
      result.cleanup();
    });
  });
});
