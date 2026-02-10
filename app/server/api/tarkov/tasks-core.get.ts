import type { TarkovTasksCoreQueryResult } from '~/types/tarkov';
import { createTarkovFetcher, edgeCache, shouldBypassCache } from '~/server/utils/edgeCache';
import { validateAndThrow } from '~/server/utils/graphql-validation';
import { getValidatedLanguage } from '~/server/utils/language-helpers';
import { createLogger } from '~/server/utils/logger';
import { applyOverlay } from '~/server/utils/overlay';
import { CACHE_TTL_DEFAULT, validateGameMode } from '~/server/utils/tarkov-cache-config';
import { TARKOV_TASKS_CORE_QUERY } from '~/server/utils/tarkov-queries';
const logger = createLogger('TarkovTasksCore');
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const bypassOverlayCache = shouldBypassCache(event);
  const lang = getValidatedLanguage(query);
  const gameMode = validateGameMode(query.gameMode);
  // Create cache key from parameters
  const cacheKey = `tasks-core-${lang}-${gameMode}`;
  const baseFetcher = createTarkovFetcher(TARKOV_TASKS_CORE_QUERY, { lang, gameMode });
  const fetcherWithOverlay = async () => {
    const rawResponse = await baseFetcher();
    // Validate GraphQL response has basic structure and data field
    // Allow partial data with errors
    validateAndThrow<TarkovTasksCoreQueryResult>(rawResponse, logger, true);
    // Apply community overlay corrections
    try {
      return await applyOverlay(rawResponse, { bypassCache: bypassOverlayCache });
    } catch (overlayError) {
      logger.error('Failed to apply overlay:', overlayError);
      throw overlayError;
    }
  };
  // Use the shared edge cache utility
  return await edgeCache(event, cacheKey, fetcherWithOverlay, CACHE_TTL_DEFAULT, {
    cacheKeyPrefix: 'tarkov',
  });
});
