import { createTarkovFetcher, edgeCache } from '~/server/utils/edgeCache';
import { getValidatedLanguage } from '~/server/utils/language-helpers';
import { CACHE_TTL_DEFAULT, validateGameMode } from '~/server/utils/tarkov-cache-config';
const TARKOV_HIDEOUT_QUERY = `
  query TarkovDataHideout($lang: LanguageCode, $gameMode: GameMode) {
    hideoutStations(lang: $lang, gameMode: $gameMode) {
      id
      name
      normalizedName
      imageLink
      levels {
        id
        level
        description
        constructionTime
          itemRequirements {
            id
            item {
              id
              iconLink
              image512pxLink
              backgroundColor
            }
            count
            quantity
            attributes {
              type
              name
              value
            }
          }
        stationLevelRequirements {
          id
          station {
            id
            name
          }
          level
        }
        skillRequirements {
          id
          name
          level
        }
        traderRequirements {
          id
          trader {
            id
            name
          }
          value
        }
        crafts {
          id
          duration
          requiredItems {
            item {
              id
              iconLink
              image512pxLink
              backgroundColor
            }
            count
            quantity
          }
          rewardItems {
            item {
              id
              iconLink
              image512pxLink
              backgroundColor
            }
            count
            quantity
          }
        }
      }
    }
  }
`;
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const lang = getValidatedLanguage(query);
  const gameMode = validateGameMode(query.gameMode);
  const cacheKey = `hideout-${lang}-${gameMode}`;
  const fetcher = createTarkovFetcher(TARKOV_HIDEOUT_QUERY, { lang, gameMode });
  return await edgeCache(event, cacheKey, fetcher, CACHE_TTL_DEFAULT, { cacheKeyPrefix: 'tarkov' });
});
