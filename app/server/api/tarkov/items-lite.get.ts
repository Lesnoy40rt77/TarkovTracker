import { createTarkovFetcher, edgeCache } from '~/server/utils/edgeCache';
import { isSupportedLanguage } from '~/server/utils/language-helpers';
import { CACHE_TTL_EXTENDED } from '~/server/utils/tarkov-cache-config';
import { TARKOV_ITEMS_LITE_QUERY } from '~/server/utils/tarkov-queries';
/** Query parameters for items-lite endpoint */
interface QueryParams {
  lang?: string | string[];
}
/**
 * Validates and parses query parameters at runtime.
 * Returns validated params or throws an error with details.
 */
function parseQueryParams(rawQuery: unknown): QueryParams {
  // Ensure rawQuery is an object
  if (rawQuery === null || typeof rawQuery !== 'object') {
    throw new Error('Query must be an object');
  }
  const query = rawQuery as Record<string, unknown>;
  const result: QueryParams = {};
  // Validate lang: must be undefined, string, or array of strings
  if (query.lang !== undefined) {
    if (Array.isArray(query.lang)) {
      // Validate all elements are strings
      if (query.lang.every((item): item is string => typeof item === 'string')) {
        result.lang = query.lang;
      } else {
        throw new Error('lang array must contain only strings');
      }
    } else if (typeof query.lang === 'string') {
      result.lang = query.lang;
    } else {
      throw new Error('lang must be a string or array of strings');
    }
  }
  return result;
}
export default defineEventHandler(async (event) => {
  let query: QueryParams;
  try {
    query = parseQueryParams(getQuery(event));
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: error instanceof Error ? error.message : 'Invalid query parameters',
    });
  }
  // Validate and sanitize inputs - handle array case and coerce to string safely
  const rawLang = query.lang;
  const normalizedLang = String(
    Array.isArray(rawLang) ? (rawLang[0] ?? 'en') : (rawLang ?? 'en')
  ).toLowerCase();
  // Ensure valid language (fallback to English if unsupported)
  const lang = isSupportedLanguage(normalizedLang) ? normalizedLang : 'en';
  // Create cache key from parameters
  const cacheKey = `items-lite-${lang}`;
  // Create fetcher function for tarkov.dev API
  const fetcher = createTarkovFetcher(TARKOV_ITEMS_LITE_QUERY, { lang });
  // Use the shared edge cache utility
  return edgeCache(event, cacheKey, fetcher, CACHE_TTL_EXTENDED, {
    cacheKeyPrefix: 'tarkov',
  });
});
