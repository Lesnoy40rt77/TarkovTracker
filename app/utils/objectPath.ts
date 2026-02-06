/**
 * Object Path Utility
 *
 * Provides lodash-like get/set operations using path strings.
 * Supports dot notation ("a.b.c") and bracket notation ("items[0].name").
 */
import { logger } from '@/utils/logger';
/**
 * Parse a path string into segments, handling both dot notation and bracket notation.
 * Supports: "a.b.c", "items[0].name", "items.0.name", "a[0][1].b"
 *
 * @throws Error if quoted bracket keys are detected (e.g., items["key"] or items['key'])
 * @throws Error if path contains consecutive dots
 * @limitation Only numeric bracket indices are supported (e.g., items[0]).
 * Quoted string keys like items["key"] or items['key'] are NOT supported.
 * Use dot notation for string keys: items.key
 */
function parsePath(path: string): string[] {
  if (!path || path === '.') return [];
  // Detect unsupported quoted bracket patterns and throw a clear error
  if (/\[(?:'[^']*'|"[^"]*")\]/.test(path)) {
    throw new Error(
      `parsePath: quoted bracket keys are not supported: "${path}". Use dot notation instead (e.g., items.key)`
    );
  }
  // Detect consecutive dots which indicate a malformed path
  if (/\.\./.test(path)) {
    throw new Error(
      `parsePath: Malformed path "${path}" contains consecutive dots. Use single dots for separation (e.g., "a.b.c").`
    );
  }
  // Replace numeric bracket notation with dot notation, then split
  // "items[0].name" -> "items.0.name" -> ["items", "0", "name"]
  const normalized = path.replace(/\[(\d+)\]/g, '.$1').replace(/^\./, '');
  return normalized.split('.').filter((segment) => segment !== '');
}
/**
 * Check if a string represents a non-negative integer (array index)
 */
function isArrayIndex(segment: string): boolean {
  if (!/^\d+$/.test(segment)) return false;
  const value = Number(segment);
  return Number.isSafeInteger(value) && value >= 0;
}
/**
 * Keys that could lead to prototype pollution if used in object paths.
 */
const DANGEROUS_KEYS = ['__proto__', 'constructor', 'prototype'] as const;
/**
 * Maximum allowed array index to prevent excessive memory usage from sparse arrays.
 * Valid indices are 0 through MAX_ARRAY_INDEX inclusive (i.e., boundary check uses index > maxIndex).
 * Can be overridden via the `maxArrayIndex` option in set().
 */
export const MAX_ARRAY_INDEX = 10_000;
/**
 * Absolute upper bound for array indices to prevent memory exhaustion.
 * Even when users override maxArrayIndex, this cap is enforced for safety.
 */
export const MAX_SAFE_ARRAY_INDEX = 1_000_000;
/**
 * Validate that a value is a valid max index: finite, non-negative integer within safe bounds.
 * This helper centralizes validation logic used by both set() options and validateArrayIndex().
 * @param value - The value to validate
 * @param context - Context string for error messages (e.g., function name)
 * @param upperBound - Maximum allowed value (defaults to MAX_SAFE_ARRAY_INDEX)
 * @throws TypeError if value is invalid
 */
function validateMaxIndexValue(
  value: number,
  context: string,
  upperBound: number = MAX_SAFE_ARRAY_INDEX
): void {
  if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0 || value > upperBound) {
    throw new TypeError(
      `${context}: Invalid maxIndex value ${value}. ` +
        `Expected a finite, non-negative integer <= ${upperBound}.`
    );
  }
}
/**
 * Validate that an array index doesn't exceed the maximum allowed value.
 * Also validates that maxIndex itself is a valid, finite, non-negative integer.
 * @throws TypeError if maxIndex is invalid (NaN, Infinity, negative, non-integer, or exceeds safe bounds)
 * @throws RangeError if index exceeds maxIndex
 */
function validateArrayIndex(index: number, maxIndex: number, path: string): void {
  // Validate maxIndex is a valid integer (not NaN, Infinity, negative)
  // Note: we don't enforce upperBound to MAX_ARRAY_INDEX because users can override via options.maxArrayIndex
  validateMaxIndexValue(maxIndex, `validateArrayIndex() [path: '${path}']`);
  if (index > maxIndex) {
    throw new RangeError(
      `set(): Array index ${index} exceeds maximum allowed index ${maxIndex}. ` +
        `Path: '${path}'. Use options.maxArrayIndex to override this limit.`
    );
  }
}
/**
 * Check if a key is a dangerous prototype-polluting key.
 */
function isDangerousKey(key: string): boolean {
  return DANGEROUS_KEYS.includes(key as (typeof DANGEROUS_KEYS)[number]);
}
/**
 * Validate that a container's type matches the expected type for the next key.
 * Throws TypeError if there's a type mismatch (e.g., object when array expected).
 *
 * @param container - The container value to validate (must be non-null object)
 * @param nextKey - The next key that will be used to access into the container
 * @param nextIsArrayIndex - Whether the next key is a numeric array index
 * @param currentPath - The path to the current container (for error messages)
 * @param fullPath - The full path being set (for error messages)
 */
function validateContainerType(
  container: unknown,
  nextKey: string,
  nextIsArrayIndex: boolean,
  currentPath: string,
  fullPath: string
): void {
  const isArray = Array.isArray(container);
  if (nextIsArrayIndex && !isArray) {
    throw new TypeError(
      `set(): Expected array at '${currentPath}' for index '${nextKey}' but found object. Full path: '${fullPath}'`
    );
  }
  if (!nextIsArrayIndex && isArray) {
    throw new TypeError(
      `set(): Expected object at '${currentPath}' for key '${nextKey}' but found array. Full path: '${fullPath}'`
    );
  }
}
/**
 * Get a value from an object by path.
 * Supports dot notation ("a.b.c") and array index notation ("items[0].name" or "items.0.name").
 *
 * @param obj - The object to traverse
 * @param path - The path string (use '.' or '' to return the object itself)
 * @param defaultValue - Value to return if path doesn't exist
 * @returns The value at path or defaultValue
 *
 * @example
 * ```ts
 * const data = { user: { name: 'John', items: ['a', 'b'] } };
 * get(data, 'user.name');        // 'John'
 * get(data, 'user.items[0]');    // 'a'
 * get(data, 'user.missing', 42); // 42
 * ```
 */
export function get(obj: Record<string, unknown>, path: string, defaultValue?: unknown): unknown {
  if (path === '.' || path === '') return obj;
  const keys = parsePath(path);
  let result: unknown = obj;
  for (const key of keys) {
    if (result == null) {
      return defaultValue;
    }
    if (Array.isArray(result)) {
      if (!isArrayIndex(key)) {
        return defaultValue;
      }
      const index = parseInt(key, 10);
      if (index >= result.length) {
        return defaultValue;
      }
      result = result[index];
    } else if (typeof result === 'object') {
      if (!(key in (result as Record<string, unknown>))) {
        return defaultValue;
      }
      result = (result as Record<string, unknown>)[key];
    } else {
      return defaultValue;
    }
  }
  return result;
}
/**
 * Set a value on an object by path.
 * Supports dot notation ("a.b.c") and array index notation ("items[0].name" or "items.0.name").
 * Creates intermediate objects/arrays as needed (sparse arrays for large indices).
 *
 * @param obj - The object to modify
 * @param path - The path string (use '.' or '' to Object.assign value onto obj)
 * @param value - The value to set
 * @param options - Optional configuration
 * @param options.maxArrayIndex - Maximum allowed array index. Defaults to MAX_ARRAY_INDEX (10,000).
 *   WARNING: Very large values can cause memory/performance issues with sparse arrays.
 *   Recommended to keep <= MAX_ARRAY_INDEX. Absolute cap is MAX_SAFE_ARRAY_INDEX (1,000,000).
 * @throws TypeError if path '.' is used with non-object value
 * @throws TypeError if trying to traverse through a primitive (non-object/non-array)
 * @throws TypeError if maxArrayIndex exceeds MAX_SAFE_ARRAY_INDEX
 * @throws RangeError if an array index exceeds maxArrayIndex
 *
 * @example
 * ```ts
 * const data = {};
 * set(data, 'user.name', 'John');     // { user: { name: 'John' } }
 * set(data, 'items[0].id', 1);        // { user: {...}, items: [{ id: 1 }] }
 * ```
 */
export function set(
  obj: Record<string, unknown>,
  path: string,
  value: unknown,
  options?: { maxArrayIndex?: number }
): void {
  const maxIndex = options?.maxArrayIndex ?? MAX_ARRAY_INDEX;
  // Validate maxArrayIndex immediately to fail fast on invalid options
  // Enforces upper bound of MAX_SAFE_ARRAY_INDEX to prevent memory exhaustion
  if (options?.maxArrayIndex !== undefined) {
    validateMaxIndexValue(options.maxArrayIndex, `set() [path: '${path}']`, MAX_SAFE_ARRAY_INDEX);
    // Warn if exceeding recommended MAX_ARRAY_INDEX (but still within safe bounds)
    if (options.maxArrayIndex > MAX_ARRAY_INDEX) {
      logger.warn(
        `[objectPath] set(): maxArrayIndex ${options.maxArrayIndex} exceeds recommended ` +
          `MAX_ARRAY_INDEX (${MAX_ARRAY_INDEX}). This may cause memory/performance issues. ` +
          `Path: '${path}'`
      );
    }
  }
  if (path === '.' || path === '') {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new TypeError(
        `set(): Cannot use Object.assign with path '${path}' when value is ${
          value === null ? 'null' : Array.isArray(value) ? 'Array' : typeof value
        }. Expected a non-null plain object.`
      );
    }
    // Safe property copy that prevents prototype pollution
    for (const key of Object.keys(value as Record<string, unknown>)) {
      if (isDangerousKey(key)) {
        throw new TypeError(
          `set(): Dangerous key '${key}' is not allowed to prevent prototype pollution.`
        );
      }
      obj[key] = (value as Record<string, unknown>)[key];
    }
    return;
  }
  const keys = parsePath(path);
  const lastKey = keys[keys.length - 1] as string;
  // Validate all keys for dangerous prototype-polluting names
  for (const key of keys) {
    if (isDangerousKey(key)) {
      throw new TypeError(
        `set(): Dangerous key '${key}' in path '${path}' is not allowed to prevent prototype pollution.`
      );
    }
  }
  let current: Record<string, unknown> | unknown[] = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i] as string;
    const nextKey = keys[i + 1] as string;
    const nextIsArrayIndex = isArrayIndex(nextKey);
    const traversedPath = keys.slice(0, i).join('.') || '(root)';
    if (Array.isArray(current)) {
      if (!isArrayIndex(key)) {
        throw new TypeError(
          `set(): Cannot use non-numeric key '${key}' on array at path '${traversedPath}'. Full path: '${path}'`
        );
      }
      const index = parseInt(key, 10);
      validateArrayIndex(index, maxIndex, path);
      // Check if there's a primitive at this index that we can't traverse into
      if (current[index] != null && typeof current[index] !== 'object') {
        const currentPath = keys.slice(0, i + 1).join('.');
        throw new TypeError(
          `set(): Cannot create property '${nextKey}' on ${typeof current[index]} at path '${currentPath}'. Full path: '${path}'`
        );
      }
      // Validate type of existing object against next key requirement
      if (current[index] != null && typeof current[index] === 'object') {
        validateContainerType(
          current[index],
          nextKey,
          nextIsArrayIndex,
          keys.slice(0, i + 1).join('.'),
          path
        );
      }
      // Use direct assignment for sparse array (avoid O(n) fill with push loop)
      if (current[index] == null) {
        current[index] = nextIsArrayIndex ? [] : {};
      }
      current = current[index] as Record<string, unknown> | unknown[];
    } else if (typeof current === 'object' && current !== null) {
      const currentObj = current as Record<string, unknown>;
      if (key in currentObj && currentObj[key] != null && typeof currentObj[key] === 'object') {
        // Validate existing value type
        validateContainerType(
          currentObj[key],
          nextKey,
          nextIsArrayIndex,
          keys.slice(0, i + 1).join('.'),
          path
        );
      } else if (
        key in currentObj &&
        currentObj[key] != null &&
        typeof currentObj[key] !== 'object'
      ) {
        // Primitive check
        const currentPath = keys.slice(0, i + 1).join('.');
        throw new TypeError(
          `set(): Cannot create property '${nextKey}' on ${typeof currentObj[key]} at path '${currentPath}'. Full path: '${path}'`
        );
      }
      if (!(key in currentObj) || currentObj[key] == null) {
        currentObj[key] = nextIsArrayIndex ? [] : {};
      }
      current = currentObj[key] as Record<string, unknown> | unknown[];
    } else {
      throw new TypeError(
        `set(): Cannot traverse into ${current === null ? 'null' : typeof current} at path '${traversedPath}'. Full path: '${path}'`
      );
    }
  }
  // Set the final value using direct assignment (sparse array for large indices)
  if (Array.isArray(current)) {
    if (!isArrayIndex(lastKey)) {
      throw new TypeError(
        `set(): Cannot use non-numeric key '${lastKey}' on array. Full path: '${path}'`
      );
    }
    const index = parseInt(lastKey, 10);
    validateArrayIndex(index, maxIndex, path);
    // Direct assignment creates sparse array - no need to fill with undefined
    current[index] = value;
  } else {
    (current as Record<string, unknown>)[lastKey] = value;
  }
}
