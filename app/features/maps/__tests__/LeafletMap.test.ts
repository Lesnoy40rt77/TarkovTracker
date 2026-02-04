import { describe, expect, it, vi, beforeEach } from 'vitest';
vi.mock('@/utils/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));
describe('LeafletMap utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  describe('map configuration validation', () => {
    it('isValidMapSvgConfig returns true for valid SVG config', async () => {
      const { isValidMapSvgConfig } = await import('@/utils/mapCoordinates');
      const validConfig = {
        file: 'customs.svg',
        floors: ['ground'],
        defaultFloor: 'ground',
        coordinateRotation: 0,
        bounds: [
          [0, 0],
          [100, 100],
        ],
      };
      expect(isValidMapSvgConfig(validConfig)).toBe(true);
    });
    it('isValidMapSvgConfig returns false for invalid SVG config', async () => {
      const { isValidMapSvgConfig } = await import('@/utils/mapCoordinates');
      expect(isValidMapSvgConfig(null)).toBe(false);
      expect(isValidMapSvgConfig(undefined)).toBe(false);
      expect(isValidMapSvgConfig({})).toBe(false);
    });
    it('isValidMapTileConfig returns true for valid tile config', async () => {
      const { isValidMapTileConfig } = await import('@/utils/mapCoordinates');
      const validConfig = {
        tilePath: 'https://tiles.example.com/{z}/{x}/{y}.png',
        coordinateRotation: 0,
        bounds: [
          [0, 0],
          [100, 100],
        ],
        minZoom: 1,
        maxZoom: 6,
      };
      expect(isValidMapTileConfig(validConfig)).toBe(true);
    });
  });
  describe('leaflet map options', () => {
    it('getLeafletMapOptions returns map configuration', async () => {
      const { getLeafletMapOptions } = await import('@/utils/mapCoordinates');
      const mockL = { CRS: { Simple: {} } } as unknown as typeof import('leaflet');
      const options = getLeafletMapOptions(mockL);
      expect(options).toHaveProperty('crs');
      expect(options).toHaveProperty('minZoom');
      expect(options).toHaveProperty('maxZoom');
    });
    it('getLeafletBounds returns bounds array', async () => {
      const { getLeafletBounds } = await import('@/utils/mapCoordinates');
      const bounds = getLeafletBounds();
      expect(bounds).toEqual([
        [0, 0],
        [100, 100],
      ]);
    });
  });
  describe('leaflet layer group operations', () => {
    it('clearLayers removes all layers from group', async () => {
      const leafletModule = await import('leaflet');
      const L = leafletModule.default || leafletModule;
      const container = document.createElement('div');
      container.style.width = '800px';
      container.style.height = '600px';
      document.body.appendChild(container);
      const map = L.map(container, { crs: L.CRS.Simple });
      const layerGroup = L.layerGroup().addTo(map);
      const childLayer = L.layerGroup();
      layerGroup.addLayer(childLayer);
      expect(layerGroup.getLayers().length).toBe(1);
      layerGroup.clearLayers();
      expect(layerGroup.getLayers().length).toBe(0);
      map.remove();
      container.remove();
    });
    it('addTo adds layer group to map', async () => {
      const leafletModule = await import('leaflet');
      const L = leafletModule.default || leafletModule;
      const container = document.createElement('div');
      container.style.width = '800px';
      container.style.height = '600px';
      document.body.appendChild(container);
      const map = L.map(container, { crs: L.CRS.Simple });
      const layerGroup = L.layerGroup();
      layerGroup.addTo(map);
      expect(map.hasLayer(layerGroup)).toBe(true);
      map.remove();
      container.remove();
    });
  });
});
