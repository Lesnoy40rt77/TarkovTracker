/**
 * Composable for managing Leaflet map instances for Tarkov maps.
 * Handles map initialization, SVG overlay loading, floor switching, and layer management.
 */
import { useDebounceFn } from '@vueuse/core';
import type L from 'leaflet';
import {
  ref,
  shallowRef,
  onMounted,
  onUnmounted,
  watch,
  nextTick,
  type Ref,
  type ShallowRef,
  computed,
} from 'vue';
import type { TarkovMap } from '@/types/tarkov';
import { logger } from '@/utils/logger';
import {
  getLeafletBounds,
  getLeafletMapOptions,
  getMapSvgCdnUrl,
  getMapSvgFallbackUrl,
  getSvgOverlayBounds,
  isValidMapSvgConfig,
  isValidMapTileConfig,
  normalizeTileConfig,
  type MapRenderConfig,
  type MapSvgConfig,
  type MapTileConfig,
} from '@/utils/mapCoordinates';
export interface UseLeafletMapOptions {
  /** Container element ref */
  containerRef: Ref<HTMLElement | null>;
  /** Map data */
  map: Ref<TarkovMap | null>;
  /** Initial floor selection */
  initialFloor?: string;
  /** Enable idle detection for performance */
  enableIdleDetection?: boolean;
  /** Idle timeout in milliseconds */
  idleTimeout?: number;
}
export interface UseLeafletMapReturn {
  /** Leaflet map instance */
  mapInstance: ShallowRef<L.Map | null>;
  /** Leaflet library reference */
  leaflet: ShallowRef<typeof L | null>;
  /** Currently selected floor */
  selectedFloor: Ref<string>;
  /** Available floors for the current map */
  floors: Ref<string[]>;
  /** Whether the map has multiple floors */
  hasMultipleFloors: Ref<boolean>;
  /** Whether the map is loading */
  isLoading: Ref<boolean>;
  /** Whether the map is in idle mode */
  isIdle: Ref<boolean>;
  /** SVG overlay layer */
  svgLayer: ShallowRef<L.SVGOverlay | null>;
  /** Objective markers layer group */
  objectiveLayer: ShallowRef<L.LayerGroup | null>;
  /** Extract markers layer group */
  extractLayer: ShallowRef<L.LayerGroup | null>;
  /** Set the current floor */
  setFloor: (floor: string) => void;
  /** Refresh the map view */
  refreshView: () => void;
  /** Clear all markers */
  clearMarkers: () => void;
  /** Destroy the map instance */
  destroy: () => void;
}
// SVG cache to avoid refetching
const svgCache = new Map<string, string>();
/**
 * Fetches SVG content with fallback support.
 */
async function fetchSvgContent(
  primaryUrl: string,
  fallbackUrls: string[] = []
): Promise<string | null> {
  // Check cache first
  if (svgCache.has(primaryUrl)) {
    return svgCache.get(primaryUrl)!;
  }
  try {
    const response = await fetch(primaryUrl);
    if (response.ok) {
      const content = await response.text();
      svgCache.set(primaryUrl, content);
      return content;
    }
  } catch (e) {
    logger.warn(`Failed to fetch SVG from primary URL: ${primaryUrl}`, e);
  }
  // Try fallbacks in order
  for (const fallbackUrl of fallbackUrls) {
    if (!fallbackUrl) continue;
    if (svgCache.has(fallbackUrl)) {
      return svgCache.get(fallbackUrl)!;
    }
    try {
      const response = await fetch(fallbackUrl);
      if (response.ok) {
        const content = await response.text();
        svgCache.set(fallbackUrl, content);
        svgCache.set(primaryUrl, content); // Cache under primary URL too
        return content;
      }
    } catch (e) {
      logger.warn(`Failed to fetch SVG from fallback URL: ${fallbackUrl}`, e);
    }
  }
  return null;
}
/**
 * Parses SVG content string to SVG element.
 */
function parseSvgContent(content: string): SVGElement | null {
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'image/svg+xml');
  // Check for parse errors
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    logger.error('SVG parse error:', parseError.textContent);
    return null;
  }
  return doc.documentElement as unknown as SVGElement;
}
export function useLeafletMap(options: UseLeafletMapOptions): UseLeafletMapReturn {
  const {
    containerRef,
    map,
    initialFloor,
    enableIdleDetection = true,
    idleTimeout = 60000, // 1 minute
  } = options;
  // State
  const mapInstance = shallowRef<L.Map | null>(null);
  const leaflet = shallowRef<typeof L | null>(null);
  const selectedFloor = ref<string>('');
  const isLoading = ref(false);
  const isIdle = ref(false);
  const svgLayer = shallowRef<L.SVGOverlay | null>(null);
  const tileLayer = shallowRef<L.TileLayer | null>(null);
  const objectiveLayer = shallowRef<L.LayerGroup | null>(null);
  const extractLayer = shallowRef<L.LayerGroup | null>(null);
  const crsKey = ref('');
  const renderKey = ref('');
  // Map event handlers
  const onWheel = (e: WheelEvent) => {
    if (!mapInstance.value) return;
    // Shift + Scroll: Zoom
    if (e.shiftKey) {
      e.preventDefault();
      const options = mapInstance.value.options;
      const zoomDelta = options?.zoomDelta ?? 1;
      const zoomSnap = options?.zoomSnap ?? 1;
      const delta = e.deltaY > 0 ? -zoomDelta : zoomDelta;
      let newZoom = mapInstance.value.getZoom() + delta;
      if (zoomSnap > 0) {
        newZoom = Math.round(newZoom / zoomSnap) * zoomSnap;
      }
      const zoomTarget = mapInstance.value.mouseEventToLatLng(e);
      mapInstance.value.setZoomAround(zoomTarget, newZoom);
    }
    // Ctrl + Scroll: Cycle Floors
    else if (e.ctrlKey && hasMultipleFloors.value) {
      e.preventDefault();
      const currentIndex = floors.value.indexOf(selectedFloor.value);
      if (currentIndex === -1) return;
      // Scroll UP (negative delta) -> Go UP a floor (next index)
      // Scroll DOWN (positive delta) -> Go DOWN a floor (previous index)
      // Assuming floors are ordered lowest to highest in array
      const direction = e.deltaY < 0 ? 1 : -1;
      const nextIndex = currentIndex + direction;
      if (nextIndex >= 0 && nextIndex < floors.value.length) {
        const nextFloor = floors.value[nextIndex];
        if (nextFloor !== undefined) {
          setFloor(nextFloor);
        }
      }
    }
  };
  // Idle detection timer
  let idleTimer: ReturnType<typeof setTimeout> | null = null;
  // Resize observer
  let resizeObserver: ResizeObserver | null = null;
  // Computed
  const getSvgConfig = (): MapSvgConfig | undefined => {
    const svgConfig = map.value?.svg;
    return isValidMapSvgConfig(svgConfig) ? svgConfig : undefined;
  };
  const getTileConfig = (): MapTileConfig | undefined => {
    const tileConfig = map.value?.tile;
    if (!isValidMapTileConfig(tileConfig)) return undefined;
    return normalizeTileConfig(tileConfig);
  };
  const getRenderConfig = (): MapRenderConfig | undefined => getSvgConfig() ?? getTileConfig();
  const getRenderKey = (
    svgConfig?: MapSvgConfig,
    tileConfig?: MapTileConfig
  ): string | undefined => {
    if (svgConfig) {
      return JSON.stringify({
        type: 'svg',
        file: svgConfig.file,
        floors: svgConfig.floors,
        defaultFloor: svgConfig.defaultFloor,
        svgBounds: svgConfig.svgBounds ?? null,
      });
    }
    if (tileConfig) {
      return JSON.stringify({
        type: 'tile',
        tilePath: tileConfig.tilePath,
        minZoom: tileConfig.minZoom ?? null,
        maxZoom: tileConfig.maxZoom ?? null,
      });
    }
    return undefined;
  };
  const floors = computed<string[]>(() => {
    return getSvgConfig()?.floors ?? [];
  });
  const hasMultipleFloors = computed(() => floors.value.length > 1);
  const getCrsKey = (config?: MapRenderConfig): string => {
    if (!config) return 'none';
    return JSON.stringify({
      transform: config.transform ?? null,
      coordinateRotation: config.coordinateRotation ?? 0,
      bounds: config.bounds,
      svgBounds: 'svgBounds' in config ? (config.svgBounds ?? null) : null,
    });
  };
  /**
   * Resets the idle timer.
   */
  function resetIdleTimer() {
    if (!enableIdleDetection) return;
    if (idleTimer) {
      clearTimeout(idleTimer);
    }
    if (isIdle.value) {
      isIdle.value = false;
      // Re-enable interactions when coming out of idle
      if (mapInstance.value) {
        mapInstance.value.dragging.enable();
      }
    }
    idleTimer = setTimeout(() => {
      isIdle.value = true;
      // Disable some interactions when idle to reduce CPU
      if (mapInstance.value) {
        // Keep zoom available but reduce update frequency
        mapInstance.value.options.zoomSnap = 1;
      }
    }, idleTimeout);
  }
  /**
   * Loads SVG overlay for a standard map (single SVG file).
   */
  async function loadStandardMapSvg(L: typeof import('leaflet')): Promise<void> {
    const svgConfig = map.value?.svg;
    if (!isValidMapSvgConfig(svgConfig)) return;
    const floor = selectedFloor.value || svgConfig.defaultFloor;
    const fileBase = svgConfig.file.replace(/\.svg$/i, '');
    const mapName = fileBase || map.value?.normalizedName || map.value?.name || '';
    const baseUrl = `https://assets.tarkov.dev/maps/svg/${svgConfig.file}`;
    const perFloorUrl = getMapSvgCdnUrl(mapName, floor);
    const fallbackUrl = getMapSvgFallbackUrl(svgConfig.file);
    const hasMultipleFloors = svgConfig.floors.length > 1;
    const primaryUrl = baseUrl;
    const fallbackUrls = hasMultipleFloors ? [fallbackUrl] : [perFloorUrl, fallbackUrl];
    const svgContent = await fetchSvgContent(primaryUrl, fallbackUrls);
    if (!svgContent) {
      logger.error(`Failed to load SVG for map: ${mapName}`);
      return;
    }
    const svgElement = parseSvgContent(svgContent);
    if (!svgElement) return;
    if (tileLayer.value && mapInstance.value) {
      mapInstance.value.removeLayer(tileLayer.value);
      tileLayer.value = null;
    }
    // Remove existing SVG layer
    if (svgLayer.value && mapInstance.value) {
      mapInstance.value.removeLayer(svgLayer.value);
    }
    // Create new SVG overlay using svgBounds if available
    const bounds = getSvgOverlayBounds(svgConfig);
    svgLayer.value = L.svgOverlay(svgElement, bounds, { pane: 'mapBackground' });
    if (mapInstance.value) {
      svgLayer.value.addTo(mapInstance.value);
      // Apply floor visibility if there are multiple floors in a single SVG
      if (floors.value.length > 1) {
        updateFloorVisibility(svgElement);
      }
    }
  }
  async function loadTileMap(
    L: typeof import('leaflet'),
    tileConfig: MapTileConfig
  ): Promise<void> {
    const map = mapInstance.value;
    if (!map) return;
    if (tileLayer.value) {
      map.removeLayer(tileLayer.value);
      tileLayer.value = null;
    }
    try {
      const bounds = getLeafletBounds(tileConfig);
      tileLayer.value = L.tileLayer(tileConfig.tilePath, {
        minZoom: tileConfig.minZoom ?? 1,
        maxZoom: tileConfig.maxZoom ?? 6,
        noWrap: true,
        bounds,
        pane: 'mapBackground',
      });
      tileLayer.value.addTo(map);
      if (svgLayer.value) {
        map.removeLayer(svgLayer.value);
        svgLayer.value = null;
      }
    } catch (error) {
      if (tileLayer.value && map.hasLayer(tileLayer.value)) {
        map.removeLayer(tileLayer.value);
      }
      tileLayer.value = null;
      logger.error('Failed to load tile map layer:', error);
    }
  }
  /**
   * Checks if a floor name represents an underground/basement level.
   */
  function isUndergroundFloor(floorName: string): boolean {
    const lowerName = floorName.toLowerCase();
    return (
      lowerName.includes('underground') ||
      lowerName.includes('basement') ||
      lowerName.includes('bunker')
    );
  }
  /**
   * Finds the ground-level floor index to use as an overlay when viewing underground.
   * Returns the first floor above the selected floor that contains 'ground' in its name,
   * or the floor immediately above if no 'ground' floor exists.
   */
  function findGroundOverlayIndex(selectedIndex: number): number {
    // Look for a floor with 'ground' in the name above the selected floor
    for (let i = selectedIndex + 1; i < floors.value.length; i++) {
      if (floors.value[i]?.toLowerCase().includes('ground')) {
        return i;
      }
    }
    // Fall back to the floor immediately above
    if (selectedIndex + 1 < floors.value.length) {
      return selectedIndex + 1;
    }
    return -1;
  }
  /**
   * Updates floor visibility in the SVG (for single-file maps with multiple floors).
   */
  function updateFloorVisibility(svgElement: SVGElement): void {
    const selectedIndex = floors.value.indexOf(selectedFloor.value);
    if (selectedIndex === -1) return;
    const svgConfig = map.value?.svg;
    const stackFloors =
      isValidMapSvgConfig(svgConfig) && svgConfig.stackFloors === false ? false : true;
    const inactiveFloorOpacity = 0.7;
    const undergroundOverlayOpacity = 0.3;
    // Detect underground/basement/bunker floors
    const isUnderground = isUndergroundFloor(selectedFloor.value);
    const groundFloorIndex = isUnderground ? findGroundOverlayIndex(selectedIndex) : -1;
    // Track selected floor element for reordering (to render on top)
    let selectedFloorGroup: SVGElement | null = null;
    for (let index = 0; index < floors.value.length; index++) {
      const floor = floors.value[index];
      const floorGroup = svgElement.querySelector(`#${floor}`);
      if (floorGroup instanceof SVGElement) {
        const keepWith = floorGroup.getAttribute('data-keep-with-group');
        const isSelected = floor === selectedFloor.value;
        const isKeptWithSelected = keepWith === selectedFloor.value;
        const isGroundOverlay = isUnderground && index === groundFloorIndex;
        const shouldShow =
          isSelected ||
          isKeptWithSelected ||
          isGroundOverlay ||
          (stackFloors && index <= selectedIndex);
        floorGroup.style.display = shouldShow ? 'block' : 'none';
        if (!shouldShow) {
          floorGroup.style.opacity = '0';
          floorGroup.style.pointerEvents = 'none';
          continue;
        }
        let opacity = inactiveFloorOpacity;
        if (isSelected) opacity = 1;
        else if (isGroundOverlay) opacity = undergroundOverlayOpacity;
        floorGroup.style.opacity = String(opacity);
        floorGroup.style.pointerEvents = 'auto';
        // Track selected floor for z-order fix
        if (isSelected) {
          selectedFloorGroup = floorGroup;
        }
      }
    }
    // Move selected floor to end of parent so it renders on top of overlay floors
    // This ensures basement/bunker floors appear above the transparent ground overlay
    if (selectedFloorGroup?.parentNode) {
      selectedFloorGroup.parentNode.appendChild(selectedFloorGroup);
    }
  }
  /**
   * Sets the current floor and updates visibility.
   */
  function setFloor(floor: string): void {
    if (!floors.value.includes(floor)) return;
    selectedFloor.value = floor;
    // Use standard floor visibility for all maps
    if (svgLayer.value) {
      const svgElement = svgLayer.value.getElement();
      if (svgElement) {
        updateFloorVisibility(svgElement);
      }
    }
    resetIdleTimer();
  }
  /**
   * Initializes the Leaflet map.
   */
  async function initializeMap(): Promise<void> {
    // Skip initialization for unavailable maps or missing container
    if (!containerRef.value || map.value?.unavailable === true) return;
    isLoading.value = true;
    try {
      // Dynamic import Leaflet
      const L = await import('leaflet');
      leaflet.value = L.default || L;
      const svgConfig = getSvgConfig();
      const tileConfig = getTileConfig();
      const renderConfig = svgConfig ?? tileConfig;
      crsKey.value = getCrsKey(renderConfig);
      // Create map instance with custom CRS
      const mapOptions = getLeafletMapOptions(leaflet.value, renderConfig);
      mapInstance.value = leaflet.value.map(containerRef.value, mapOptions);
      // Create a custom pane for the map background to ensure it stays behind markers
      const backgroundPane = mapInstance.value.createPane('mapBackground');
      backgroundPane.style.zIndex = '200'; // Below overlayPane (400) and markerPane (600)
      // Set initial view using map bounds
      const bounds = getLeafletBounds(renderConfig);
      mapInstance.value.fitBounds(bounds);
      // Set initial floor
      if (svgConfig) {
        selectedFloor.value =
          initialFloor ||
          svgConfig.defaultFloor ||
          svgConfig.floors[svgConfig.floors.length - 1] ||
          '';
      } else {
        selectedFloor.value = '';
      }
      renderKey.value = getRenderKey(svgConfig, tileConfig) ?? '';
      await loadMapLayer();
      // Create layer groups for markers
      objectiveLayer.value = leaflet.value.layerGroup().addTo(mapInstance.value);
      extractLayer.value = leaflet.value.layerGroup().addTo(mapInstance.value);
      // Setup idle detection
      if (enableIdleDetection && mapInstance.value) {
        mapInstance.value.on('movestart', resetIdleTimer);
        mapInstance.value.on('zoomstart', resetIdleTimer);
        mapInstance.value.on('click', resetIdleTimer);
        resetIdleTimer();
      }
      // Attach custom wheel handler
      if (containerRef.value) {
        containerRef.value.addEventListener('wheel', onWheel, { passive: false });
      }
    } catch (error) {
      logger.error('Failed to initialize Leaflet map:', error);
    } finally {
      isLoading.value = false;
    }
    // Setup resize observer
    if (containerRef.value) {
      const handleResize = useDebounceFn(() => {
        if (mapInstance.value) {
          mapInstance.value.invalidateSize({ animate: false });
          // Optional: re-fit bounds if needed, or just invalidate size
          // refreshView(); // calling refreshView would re-fit bounds
        }
      }, 100);
      try {
        resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(containerRef.value);
      } catch (error) {
        logger.error('Failed to initialize ResizeObserver:', error);
      }
    }
  }
  /**
   * Loads the appropriate map layer for the current map.
   */
  async function loadMapLayer(): Promise<void> {
    if (!leaflet.value || !mapInstance.value) return;
    const svgConfig = getSvgConfig();
    const tileConfig = getTileConfig();
    renderKey.value = getRenderKey(svgConfig, tileConfig) ?? '';
    if (tileConfig) {
      await loadTileMap(leaflet.value, tileConfig);
      return;
    }
    if (svgConfig) {
      await loadStandardMapSvg(leaflet.value);
    }
  }
  /**
   * Refreshes the map view.
   */
  function refreshView(): void {
    if (mapInstance.value) {
      mapInstance.value.invalidateSize();
      const renderConfig = getRenderConfig();
      const bounds = getLeafletBounds(renderConfig);
      mapInstance.value.fitBounds(bounds);
    }
    resetIdleTimer();
  }
  /**
   * Clears all markers from the map.
   */
  function clearMarkers(): void {
    if (objectiveLayer.value) {
      objectiveLayer.value.clearLayers();
    }
    if (extractLayer.value) {
      extractLayer.value.clearLayers();
    }
  }
  /**
   * Destroys the map instance and cleans up.
   */
  function destroy(): void {
    if (idleTimer) {
      clearTimeout(idleTimer);
    }
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    if (mapInstance.value) {
      mapInstance.value.remove();
      mapInstance.value = null;
    }
    // Remove custom wheel handler
    if (containerRef.value) {
      containerRef.value.removeEventListener('wheel', onWheel);
    }
    svgLayer.value = null;
    tileLayer.value = null;
    objectiveLayer.value = null;
    extractLayer.value = null;
    leaflet.value = null;
  }
  // Watch for map changes
  watch(
    () => map.value,
    async (newMap) => {
      // Handle unavailable maps - destroy instance and skip initialization
      if (!newMap || newMap.unavailable === true) {
        destroy();
        return;
      }
      // If no existing map instance, try to initialize (handles switching from unavailable to available)
      if (!mapInstance.value || !leaflet.value) {
        // Wait for DOM to update (container may be inside v-else that just became visible)
        await nextTick();
        await initializeMap();
        return;
      }
      const newSvgConfig = isValidMapSvgConfig(newMap.svg) ? newMap.svg : undefined;
      const newTileConfig = isValidMapTileConfig(newMap.tile)
        ? normalizeTileConfig(newMap.tile)
        : undefined;
      const nextCrsKey = getCrsKey(newSvgConfig ?? newTileConfig);
      if (nextCrsKey !== crsKey.value) {
        destroy();
        await nextTick();
        await initializeMap();
        return;
      }
      // Update floor selection
      const svgConfig = newMap.svg;
      if (isValidMapSvgConfig(svgConfig)) {
        selectedFloor.value =
          svgConfig.defaultFloor || svgConfig.floors[svgConfig.floors.length - 1] || '';
      } else {
        selectedFloor.value = '';
      }
      const nextRenderKey = getRenderKey(newSvgConfig, newTileConfig) ?? '';
      isLoading.value = true;
      try {
        if (nextRenderKey !== renderKey.value) {
          renderKey.value = nextRenderKey;
        }
        await loadMapLayer();
        refreshView();
      } finally {
        isLoading.value = false;
      }
    }
  );
  // Lifecycle
  onMounted(() => {
    initializeMap();
  });
  onUnmounted(() => {
    destroy();
  });
  return {
    mapInstance,
    leaflet,
    selectedFloor,
    floors,
    hasMultipleFloors,
    isLoading,
    isIdle,
    svgLayer,
    objectiveLayer,
    extractLayer,
    setFloor,
    refreshView,
    clearMarkers,
    destroy,
  };
}
