#!/usr/bin/env node
/**
 * Syncs map configuration from tarkov-dev repository.
 * Fetches their maps.json and transforms it to TarkovTracker's minimal format.
 * Merges in local overrides from maps-overrides.json for TarkovTracker-specific settings.
 *
 * Usage: npm run sync:maps
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const TARKOV_DEV_MAPS_URL =
  'https://raw.githubusercontent.com/the-hideout/tarkov-dev/main/src/data/maps.json';
const OUTPUT_PATH = join(__dirname, '../app/data/maps.json');
const OVERRIDES_PATH = join(__dirname, '../app/data/maps-overrides.json');
/**
 * Extracts SVG filename from full URL path
 * e.g., "https://assets.tarkov.dev/maps/svg/Customs.svg" -> "Customs.svg"
 */
function extractSvgFilename(svgPath) {
  if (!svgPath) return null;
  const parts = svgPath.split('/');
  return parts[parts.length - 1];
}
/**
 * Extracts unique floor names from layers array
 * Layers have svgLayerName property for the floor they belong to
 */
function extractFloors(layers, defaultLayer) {
  if (!layers || layers.length === 0) {
    return defaultLayer ? [defaultLayer] : ['Ground_Level'];
  }
  const floors = new Set();
  // Add the default/base layer first
  if (defaultLayer) {
    floors.add(defaultLayer);
  }
  // Extract unique floor names from layers
  for (const layer of layers) {
    if (layer.svgLayerName) {
      floors.add(layer.svgLayerName);
    }
    if (layer.name) {
      // Some layers use 'name' instead of 'svgLayerName'
      floors.add(layer.name);
    }
  }
  // Sort floors in a logical order (underground first, then ground, then upper floors)
  const floorOrder = [
    'Underground_Level',
    'Bunkers',
    'Basement',
    'Tunnels',
    'Technical_Level',
    'Ground_Level',
    'Ground_Floor',
    'First_Level',
    'First_Floor',
    '1st_Floor',
    'Second_Level',
    'Second_Floor',
    '2nd_Floor',
    'Third_Level',
    'Third_Floor',
    '3rd_Floor',
    'Fourth_Level',
    'Fourth_Floor',
    '4th_Floor',
    'Fifth_Level',
    'Fifth_Floor',
    '5th_Floor',
  ];
  // Normalize floor names for consistent ordering
  const floorAliases = {
    Ground_Floor: 'Ground_Level',
    First_Floor: 'First_Level',
    '1st_Floor': 'First_Level',
    Second_Floor: 'Second_Level',
    '2nd_Floor': 'Second_Level',
    Third_Floor: 'Third_Level',
    '3rd_Floor': 'Third_Level',
    Fourth_Floor: 'Fourth_Level',
    '4th_Floor': 'Fourth_Level',
    Fifth_Floor: 'Fifth_Level',
    '5th_Floor': 'Fifth_Level',
  };
  const normalizeFloor = (name) => floorAliases[name] || name;
  return Array.from(floors).sort((a, b) => {
    const aNorm = normalizeFloor(a);
    const bNorm = normalizeFloor(b);
    const aIndex = floorOrder.indexOf(a) !== -1 ? floorOrder.indexOf(a) : floorOrder.indexOf(aNorm);
    const bIndex = floorOrder.indexOf(b) !== -1 ? floorOrder.indexOf(b) : floorOrder.indexOf(bNorm);
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
}
/**
 * Determines default floor from layers or svgLayer
 */
function getDefaultFloor(projection) {
  // If svgLayer is specified, use it
  if (projection.svgLayer) {
    return projection.svgLayer;
  }
  // Otherwise default to Ground_Level
  return 'Ground_Level';
}
/**
 * Transforms a tarkov-dev map entry to TarkovTracker format
 */
function transformMap(mapEntry) {
  // Find the interactive projection (primary map view)
  const interactive = mapEntry.maps?.find((m) => m.projection === 'interactive');
  if (!interactive) {
    // Map has no interactive projection - mark as unavailable
    return { unavailable: true };
  }
  const svgFile = extractSvgFilename(interactive.svgPath);
  const defaultFloor = getDefaultFloor(interactive);
  const floors = extractFloors(interactive.layers, interactive.svgLayer);
  // Determine if this is SVG-based or tile-based
  if (svgFile) {
    // SVG-based map
    const config = {
      svg: {
        file: svgFile,
        floors,
        defaultFloor,
        coordinateRotation: interactive.coordinateRotation,
        transform: interactive.transform,
        bounds: interactive.bounds,
      },
    };
    // Add optional properties if present
    if (interactive.svgBounds) {
      config.svg.svgBounds = interactive.svgBounds;
    }
    if (interactive.stackFloors !== undefined) {
      config.svg.stackFloors = interactive.stackFloors;
    }
    if (interactive.minZoom !== undefined) {
      config.svg.minZoom = interactive.minZoom;
    }
    if (interactive.maxZoom !== undefined) {
      config.svg.maxZoom = interactive.maxZoom;
    }
    return config;
  } else if (interactive.tilePath) {
    // Tile-based map
    return {
      tile: {
        tilePath: interactive.tilePath,
        coordinateRotation: interactive.coordinateRotation,
        transform: interactive.transform,
        bounds: interactive.bounds,
        minZoom: interactive.minZoom ?? 1,
        maxZoom: interactive.maxZoom ?? 6,
      },
    };
  }
  // No valid map data
  return { unavailable: true };
}
/**
 * Maps tarkov-dev normalizedName to our map keys
 */
function normalizeMapKey(normalizedName) {
  const keyMap = {
    'streets-of-tarkov': 'streetsoftarkov',
    'ground-zero': 'groundzero',
    'the-lab': 'lab',
    'the-labyrinth': 'labyrinth',
  };
  return keyMap[normalizedName] || normalizedName;
}
/**
 * Deep merges source object into target (non-mutating)
 * @returns A new merged object without modifying target
 */
function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (key === '$comment') continue;
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}
/**
 * Loads local overrides file
 */
function loadOverrides() {
  try {
    const content = readFileSync(OVERRIDES_PATH, 'utf-8');
    return JSON.parse(content);
  } catch {
    console.log('No overrides file found, using tarkov-dev data only');
    return {};
  }
}
async function syncMaps() {
  console.log('Fetching maps from tarkov-dev...');
  const response = await fetch(TARKOV_DEV_MAPS_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch maps: ${response.status} ${response.statusText}`);
  }
  const tarkovDevMaps = await response.json();
  console.log(`Found ${tarkovDevMaps.length} maps`);
  const overrides = loadOverrides();
  const overrideKeys = Object.keys(overrides).filter((k) => k !== '$comment');
  if (overrideKeys.length > 0) {
    console.log(`Loaded ${overrideKeys.length} local overrides: ${overrideKeys.join(', ')}`);
  }
  const result = {};
  for (const mapEntry of tarkovDevMaps) {
    const key = normalizeMapKey(mapEntry.normalizedName);
    const transformed = transformMap(mapEntry);
    // Apply local overrides if they exist
    result[key] = overrides[key] ? deepMerge(transformed, overrides[key]) : transformed;
    const hasOverride = overrides[key] ? ' (+ override)' : '';
    console.log(
      `  ${key}: ${transformed.unavailable ? 'unavailable' : transformed.svg ? 'svg' : 'tile'}${hasOverride}`
    );
  }
  // Sort keys alphabetically for consistent output
  const sorted = Object.keys(result)
    .sort()
    .reduce((obj, key) => {
      obj[key] = result[key];
      return obj;
    }, {});
  // Write output
  const json = JSON.stringify(sorted, null, 2) + '\n';
  writeFileSync(OUTPUT_PATH, json);
  console.log(`\nWritten to ${OUTPUT_PATH}`);
  console.log(`Total maps: ${Object.keys(sorted).length}`);
  console.log(`  Available: ${Object.values(sorted).filter((m) => !m.unavailable).length}`);
  console.log(`  Unavailable: ${Object.values(sorted).filter((m) => m.unavailable).length}`);
}
syncMaps().catch((err) => {
  const error = err instanceof Error ? err : new Error(String(err));
  const code =
    err && typeof err === 'object' && 'code' in err && typeof err.code !== 'undefined'
      ? String(err.code)
      : undefined;
  const message = error.message;
  const name = error.name;
  const isNetwork =
    name === 'FetchError' ||
    (name === 'TypeError' && /fetch|network/i.test(message)) ||
    (code ? ['ECONNRESET', 'EAI_AGAIN', 'ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT'].includes(code) : false);
  const isFilesystem =
    (code ? ['EACCES', 'EISDIR', 'ENOENT', 'ENOSPC', 'EROFS'].includes(code) : false) ||
    (err && typeof err === 'object' && 'syscall' in err && String(err.syscall).includes('write'));
  const details = { name, message, code, stack: error.stack, cause: error.cause };
  if (isNetwork) {
    console.error('Network error syncing maps.', details);
  } else if (isFilesystem) {
    console.error('Filesystem error writing map file.', details);
  } else {
    console.error('Error syncing maps.', details);
  }
  process.exit(1);
});
