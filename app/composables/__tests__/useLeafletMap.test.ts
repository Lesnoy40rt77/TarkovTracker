import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { defineComponent, nextTick, ref, type Ref } from 'vue';
import type { TarkovMap } from '@/types/tarkov';
const mockMapInstance = {
  on: vi.fn(),
  off: vi.fn(),
  remove: vi.fn(),
  fitBounds: vi.fn(),
  invalidateSize: vi.fn(),
  createPane: vi.fn(() => ({ style: {} })),
  options: { zoomDelta: 1, zoomSnap: 1 },
  dragging: { enable: vi.fn(), disable: vi.fn() },
  getZoom: vi.fn(() => 2),
  setZoomAround: vi.fn(),
  mouseEventToLatLng: vi.fn(),
  hasLayer: vi.fn(() => false),
  removeLayer: vi.fn(),
};
const mockLayerGroup = {
  addTo: vi.fn().mockReturnThis(),
  clearLayers: vi.fn(),
};
const mockSvgOverlay = {
  addTo: vi.fn().mockReturnThis(),
  getElement: vi.fn(() => null),
};
const mockTileLayer = {
  addTo: vi.fn().mockReturnThis(),
};
vi.mock('leaflet', () => ({
  default: {
    map: vi.fn(() => mockMapInstance),
    layerGroup: vi.fn(() => mockLayerGroup),
    svgOverlay: vi.fn(() => mockSvgOverlay),
    tileLayer: vi.fn(() => mockTileLayer),
    latLngBounds: vi.fn((sw, ne) => ({ sw, ne })),
    CRS: {
      Simple: {},
    },
  },
}));
vi.mock('@vueuse/core', () => ({
  useDebounceFn: vi.fn((fn) => fn),
}));
vi.mock('@/utils/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));
vi.mock('@/utils/mapCoordinates', () => ({
  getLeafletBounds: vi.fn(() => [
    [0, 0],
    [100, 100],
  ]),
  getLeafletMapOptions: vi.fn((L) => ({
    crs: L.CRS.Simple,
    minZoom: 0,
    maxZoom: 5,
    zoomSnap: 0.5,
    zoomDelta: 0.5,
  })),
  getMapSvgCdnUrl: vi.fn((name, floor) => `https://cdn.example.com/${name}/${floor}.svg`),
  getMapSvgFallbackUrl: vi.fn((file) => `https://fallback.example.com/${file}`),
  getSvgOverlayBounds: vi.fn(() => [
    [0, 0],
    [100, 100],
  ]),
  isValidMapSvgConfig: vi.fn((config) => !!config?.file),
  isValidMapTileConfig: vi.fn((config) => !!config?.tilePath),
  normalizeTileConfig: vi.fn((config) => config),
}));
describe('useLeafletMap', () => {
  let useLeafletMap: typeof import('../useLeafletMap').useLeafletMap;
  let containerRef: Ref<HTMLElement | null>;
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    containerRef = ref(document.createElement('div')) as Ref<HTMLElement | null>;
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        text: async () => '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
      }))
    );
    const module = await import('../useLeafletMap');
    useLeafletMap = module.useLeafletMap;
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.resetModules();
  });
  const mountUseLeafletMap = async (mapData: Ref<TarkovMap | null>, initialFloor?: string) => {
    let result: ReturnType<typeof useLeafletMap> | null = null;
    const wrapper = mount(
      defineComponent({
        setup() {
          result = useLeafletMap({
            containerRef,
            map: mapData,
            initialFloor,
          });
          return () => null;
        },
      })
    );
    await nextTick();
    await Promise.resolve();
    return { result: result!, wrapper };
  };
  describe('initialization', () => {
    it('creates map instance with correct options on mount', async () => {
      const leafletModule = await import('leaflet');
      const mapSpy = vi.spyOn(leafletModule.default, 'map');
      const mapData = ref<TarkovMap | null>({
        id: 'customs',
        name: 'Customs',
        normalizedName: 'customs',
        svg: {
          file: 'customs.svg',
          floors: ['ground'],
          defaultFloor: 'ground',
          coordinateRotation: 0,
          bounds: [
            [0, 0],
            [100, 100],
          ],
        },
      } as TarkovMap);
      const { getLeafletMapOptions } = await import('@/utils/mapCoordinates');
      const { result, wrapper } = await mountUseLeafletMap(mapData);
      const svgConfig = mapData.value?.svg;
      const expectedOptions = getLeafletMapOptions(
        leafletModule.default,
        typeof svgConfig === 'string' ? undefined : svgConfig
      );
      expect(mapSpy).toHaveBeenCalledWith(containerRef.value, expectedOptions);
      expect(result.isLoading.value).toBe(false);
      expect(result.selectedFloor.value).toBe('ground');
      wrapper.unmount();
    });
    it('sets default floor from map config', async () => {
      const leafletModule = await import('leaflet');
      const mapSpy = vi.spyOn(leafletModule.default, 'map');
      const mapData = ref<TarkovMap | null>({
        id: 'interchange',
        name: 'Interchange',
        normalizedName: 'interchange',
        svg: {
          file: 'interchange.svg',
          floors: ['parking', 'ground', 'second'],
          defaultFloor: 'ground',
          coordinateRotation: 0,
          bounds: [
            [0, 0],
            [100, 100],
          ],
        },
      } as TarkovMap);
      const { getLeafletMapOptions } = await import('@/utils/mapCoordinates');
      const { result, wrapper } = await mountUseLeafletMap(mapData, 'parking');
      const svgConfig = mapData.value?.svg;
      const expectedOptions = getLeafletMapOptions(
        leafletModule.default,
        typeof svgConfig === 'string' ? undefined : svgConfig
      );
      expect(mapSpy).toHaveBeenCalledWith(containerRef.value, expectedOptions);
      expect(result.floors.value).toEqual(['parking', 'ground', 'second']);
      wrapper.unmount();
    });
  });
  describe('floor management', () => {
    it('setFloor updates selectedFloor ref', async () => {
      const mapData = ref<TarkovMap | null>({
        id: 'reserve',
        name: 'Reserve',
        normalizedName: 'reserve',
        svg: {
          file: 'reserve.svg',
          floors: ['bunker', 'ground', 'roof'],
          defaultFloor: 'ground',
          coordinateRotation: 0,
          bounds: [
            [0, 0],
            [100, 100],
          ],
        },
      } as TarkovMap);
      const result = useLeafletMap({
        containerRef,
        map: mapData,
      });
      result.setFloor('bunker');
      expect(result.selectedFloor.value).toBe('bunker');
    });
    it('hasMultipleFloors returns true when floors > 1', () => {
      const mapData = ref<TarkovMap | null>({
        id: 'labs',
        name: 'The Lab',
        normalizedName: 'labs',
        svg: {
          file: 'labs.svg',
          floors: ['basement', 'ground', 'second'],
          defaultFloor: 'ground',
          coordinateRotation: 0,
          bounds: [
            [0, 0],
            [100, 100],
          ],
        },
      } as TarkovMap);
      const result = useLeafletMap({
        containerRef,
        map: mapData,
      });
      expect(result.hasMultipleFloors.value).toBe(true);
    });
    it('availableFloors computed is reactive to map changes', async () => {
      const mapData = ref<TarkovMap | null>({
        id: 'factory',
        name: 'Factory',
        normalizedName: 'factory',
        svg: {
          file: 'factory.svg',
          floors: ['basement', 'ground'],
          defaultFloor: 'ground',
          coordinateRotation: 0,
          bounds: [
            [0, 0],
            [100, 100],
          ],
        },
      } as TarkovMap);
      const result = useLeafletMap({
        containerRef,
        map: mapData,
      });
      expect(result.floors.value).toEqual(['basement', 'ground']);
      const currentSvg = mapData.value?.svg;
      const nextSvg =
        typeof currentSvg === 'string' || !currentSvg
          ? currentSvg
          : {
              ...currentSvg,
              floors: ['ground', 'upper'],
            };
      mapData.value = {
        ...(mapData.value as TarkovMap),
        svg: nextSvg,
      } as TarkovMap;
      await nextTick();
      expect(result.floors.value).toEqual(['ground', 'upper']);
    });
  });
  describe('marker management', () => {
    it('clearMarkers removes all layers', async () => {
      const mapData = ref<TarkovMap | null>({
        id: 'customs',
        name: 'Customs',
        normalizedName: 'customs',
        svg: {
          file: 'customs.svg',
          floors: ['ground'],
          defaultFloor: 'ground',
          coordinateRotation: 0,
          bounds: [
            [0, 0],
            [100, 100],
          ],
        },
      } as TarkovMap);
      const result = useLeafletMap({
        containerRef,
        map: mapData,
      });
      result.clearMarkers();
      expect(result.objectiveLayer.value).toBe(null);
    });
  });
  describe('cleanup', () => {
    it('destroy removes map instance', async () => {
      const mapData = ref<TarkovMap | null>({
        id: 'woods',
        name: 'Woods',
        normalizedName: 'woods',
        svg: {
          file: 'woods.svg',
          floors: ['ground'],
          defaultFloor: 'ground',
          coordinateRotation: 0,
          bounds: [
            [0, 0],
            [100, 100],
          ],
        },
      } as TarkovMap);
      const result = useLeafletMap({
        containerRef,
        map: mapData,
      });
      result.destroy();
      expect(result.mapInstance.value).toBe(null);
      expect(result.svgLayer.value).toBe(null);
      expect(result.objectiveLayer.value).toBe(null);
      expect(result.extractLayer.value).toBe(null);
      expect(result.leaflet.value).toBe(null);
    });
  });
});
