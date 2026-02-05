import { defineEventHandler, getQuery, setResponseHeaders } from 'h3';
import { LRUCache } from 'lru-cache';
import { useRuntimeConfig } from '#imports';
import { createLogger } from '@/server/utils/logger';
import {
  cleanText,
  extractReleaseBullets,
  normalizeCommitMessage,
  toSentence,
} from '@/utils/changelog';
import type {
  ChangelogBullet,
  ChangelogItem,
  ChangelogResponse,
  ChangelogStats,
} from '@/types/changelog';
type GitHubRelease = {
  name?: string | null;
  tag_name?: string | null;
  body?: string | null;
  published_at?: string | null;
  created_at?: string | null;
  draft?: boolean | null;
};
type GitHubCommitListItem = {
  sha?: string | null;
  commit?: {
    message?: string | null;
    author?: { date?: string | null } | null;
    committer?: { date?: string | null } | null;
  } | null;
};
type GitHubCommitDetail = {
  sha?: string | null;
  commit?: {
    message?: string | null;
    author?: { date?: string | null } | null;
    committer?: { date?: string | null } | null;
  } | null;
  stats?: {
    additions?: number;
    deletions?: number;
    total?: number;
  } | null;
};
type GitHubCompareResponse = {
  ahead_by?: number;
  behind_by?: number;
  total_commits?: number;
  files?: Array<{
    additions?: number;
    deletions?: number;
    changes?: number;
  }>;
};
type StatsCacheEntry = { stats: ChangelogStats; timestamp: number };
type GitHubConfig = { owner: string; repo: string; baseUrl: string };
const logger = createLogger('Changelog');
const changelogConfig = (() => {
  const MAX_CACHE_ENTRIES = 1000;
  const CACHE_TTL_MS = 30 * 60 * 1000;
  return {
    DEFAULT_OWNER: 'tarkovtracker-org',
    DEFAULT_REPO: 'TarkovTracker',
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 50,
    RELEASE_LIMIT: 3,
    MAX_BULLETS_PER_GROUP: 5,
    MAX_STATS_FETCHES: 20,
    CACHE_TTL_MS,
    MAX_CACHE_ENTRIES,
    SHARED_CACHE_PREFIX: 'changelog-stats',
    MAX_KEY_LENGTH: 200,
    EVICTION_BATCH_SIZE: Math.ceil(MAX_CACHE_ENTRIES * 0.1),
    FULL_EVICTION_INTERVAL_MS: 5 * 60 * 1000,
    cache: {
      statsCache: new LRUCache<string, StatsCacheEntry>({ max: MAX_CACHE_ENTRIES }),
      lastFullEviction: 0,
    },
  };
})();
const evictStaleEntries = (): number => {
  const now = Date.now();
  let evicted = 0;
  for (const [key, entry] of changelogConfig.cache.statsCache) {
    if (now - entry.timestamp >= changelogConfig.CACHE_TTL_MS) {
      changelogConfig.cache.statsCache.delete(key);
      evicted++;
    }
  }
  return evicted;
};
const evictLRU = (count: number): void => {
  if (count <= 0) return;
  let evicted = 0;
  while (evicted < count) {
    const removed = changelogConfig.cache.statsCache.pop();
    if (!removed) break;
    evicted++;
  }
};
const maybeRunFullEviction = (): void => {
  const now = Date.now();
  if (now - changelogConfig.cache.lastFullEviction < changelogConfig.FULL_EVICTION_INTERVAL_MS) {
    return;
  }
  changelogConfig.cache.lastFullEviction = now;
  evictStaleEntries();
  if (changelogConfig.cache.statsCache.size > changelogConfig.MAX_CACHE_ENTRIES) {
    evictLRU(
      changelogConfig.cache.statsCache.size -
        changelogConfig.MAX_CACHE_ENTRIES +
        changelogConfig.EVICTION_BATCH_SIZE
    );
  }
};
const isValidCacheKey = (key: string): boolean => {
  return typeof key === 'string' && key.length > 0 && key.length <= changelogConfig.MAX_KEY_LENGTH;
};
const getLocalCacheEntry = (key: string): StatsCacheEntry | null => {
  const cached = changelogConfig.cache.statsCache.get(key);
  if (!cached) return null;
  const now = Date.now();
  if (now - cached.timestamp >= changelogConfig.CACHE_TTL_MS) {
    changelogConfig.cache.statsCache.delete(key);
    return null;
  }
  return cached;
};
const setLocalCacheEntry = (key: string, entry: StatsCacheEntry): void => {
  if (!isValidCacheKey(key)) return;
  maybeRunFullEviction();
  if (
    changelogConfig.cache.statsCache.size >= changelogConfig.MAX_CACHE_ENTRIES &&
    !changelogConfig.cache.statsCache.has(key)
  ) {
    evictLRU(changelogConfig.EVICTION_BATCH_SIZE);
  }
  changelogConfig.cache.statsCache.set(key, entry);
};
const getSharedCache = (): Cache | null => {
  const cacheStorage = (
    globalThis as typeof globalThis & { caches?: CacheStorage & { default?: Cache } }
  ).caches;
  return cacheStorage?.default ?? null;
};
const getSharedCacheOrigin = (): { host: string; protocol: string } => {
  const runtimeConfig = useRuntimeConfig();
  const appUrl = runtimeConfig?.public?.appUrl;
  if (!appUrl) {
    return { host: 'tarkovtracker.org', protocol: 'https:' };
  }
  try {
    const parsedAppUrl = new URL(appUrl);
    const hostname = parsedAppUrl.hostname;
    const isLocalhost =
      hostname === 'localhost' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      /^127\./.test(hostname);
    if (isLocalhost) {
      return { host: 'tarkovtracker.org', protocol: 'https:' };
    }
    return { host: parsedAppUrl.host, protocol: parsedAppUrl.protocol || 'https:' };
  } catch {
    return { host: 'tarkovtracker.org', protocol: 'https:' };
  }
};
const buildSharedCacheRequest = (key: string): Request => {
  const { host, protocol } = getSharedCacheOrigin();
  const encodedKey = encodeURIComponent(key);
  const cacheUrl = new URL(
    `${protocol}//${host}/__edge-cache/${changelogConfig.SHARED_CACHE_PREFIX}/${encodedKey}`
  );
  return new Request(cacheUrl.toString());
};
const getSharedCacheEntry = async (key: string): Promise<StatsCacheEntry | null> => {
  const cache = getSharedCache();
  if (!cache) return null;
  try {
    const cachedResponse = await cache.match(buildSharedCacheRequest(key));
    if (!cachedResponse) return null;
    const payload = (await cachedResponse.json()) as StatsCacheEntry | null;
    if (!payload?.stats || typeof payload.timestamp !== 'number') return null;
    if (Date.now() - payload.timestamp >= changelogConfig.CACHE_TTL_MS) return null;
    return payload;
  } catch (error) {
    logger.warn('[Changelog] Failed to read shared cache.', {
      key,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
};
const setSharedCacheEntry = async (key: string, entry: StatsCacheEntry): Promise<void> => {
  const cache = getSharedCache();
  if (!cache) return;
  const ttlSeconds = Math.max(1, Math.floor(changelogConfig.CACHE_TTL_MS / 1000));
  try {
    const response = new Response(JSON.stringify(entry), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${ttlSeconds}, s-maxage=${ttlSeconds}`,
      },
    });
    await cache.put(buildSharedCacheRequest(key), response);
  } catch (error) {
    logger.warn('[Changelog] Failed to write shared cache.', {
      key,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
const parseNumber = (value: unknown, fallback: number): number => {
  if (Array.isArray(value)) return parseNumber(value[0], fallback);
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};
const getGitHubConfig = (runtimeConfig: ReturnType<typeof useRuntimeConfig>): GitHubConfig => {
  const owner =
    (typeof runtimeConfig.public.githubOwner === 'string' &&
      runtimeConfig.public.githubOwner.trim()) ||
    changelogConfig.DEFAULT_OWNER;
  const repo =
    (typeof runtimeConfig.public.githubRepo === 'string' &&
      runtimeConfig.public.githubRepo.trim()) ||
    changelogConfig.DEFAULT_REPO;
  const baseUrl = `https://api.github.com/repos/${owner}/${repo}`;
  return { owner, repo, baseUrl };
};
const fetchGithub = async <T>(url: string, githubToken?: string): Promise<T | null> => {
  let response: Response;
  try {
    const trimmedToken = typeof githubToken === 'string' ? githubToken.trim() : '';
    response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        ...(trimmedToken ? { Authorization: `token ${trimmedToken}` } : {}),
        'User-Agent': 'TarkovTracker',
      },
    });
  } catch (error) {
    logger.error('[Changelog] Network error fetching GitHub data.', {
      url,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
  const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');
  const rateLimitReset = response.headers.get('x-ratelimit-reset');
  if (response.status === 403 || response.status === 429 || rateLimitRemaining === '0') {
    logger.warn('[Changelog] GitHub rate limit reached.', {
      url,
      status: response.status,
      rateLimitRemaining,
      rateLimitReset: rateLimitReset ? new Date(Number(rateLimitReset) * 1000).toISOString() : null,
    });
    return null;
  }
  if (!response.ok) {
    let bodySnippet = '';
    try {
      bodySnippet = await response.text();
      if (bodySnippet.length > 200) {
        bodySnippet = bodySnippet.slice(0, 200) + '...';
      }
    } catch {
      bodySnippet = '[unable to read response body]';
    }
    logger.warn('[Changelog] Non-OK response from GitHub.', {
      url,
      status: response.status,
      body: bodySnippet,
    });
    return null;
  }
  try {
    return (await response.json()) as T;
  } catch (error) {
    logger.error('[Changelog] Failed to parse GitHub response.', {
      url,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
};
const fetchCommitStats = async (
  sha: string,
  baseUrl: string,
  githubToken?: string
): Promise<ChangelogStats | null> => {
  const cacheKey = `commit:${sha}`;
  const sharedCached = await getSharedCacheEntry(cacheKey);
  if (sharedCached) {
    setLocalCacheEntry(cacheKey, sharedCached);
    return sharedCached.stats;
  }
  const cached = getLocalCacheEntry(cacheKey);
  if (cached) return cached.stats;
  const detail = await fetchGithub<GitHubCommitDetail>(`${baseUrl}/commits/${sha}`, githubToken);
  if (!detail?.stats) return null;
  const stats: ChangelogStats = {
    additions: detail.stats.additions ?? 0,
    deletions: detail.stats.deletions ?? 0,
  };
  const entry = { stats, timestamp: Date.now() };
  setLocalCacheEntry(cacheKey, entry);
  await setSharedCacheEntry(cacheKey, entry);
  return stats;
};
const fetchReleaseStats = async (
  tagName: string,
  prevTagName: string | undefined,
  baseUrl: string,
  githubToken?: string
): Promise<ChangelogStats | null> => {
  const cacheKey = `release:${tagName}:${prevTagName || 'initial'}`;
  const sharedCached = await getSharedCacheEntry(cacheKey);
  if (sharedCached) {
    setLocalCacheEntry(cacheKey, sharedCached);
    return sharedCached.stats;
  }
  const cached = getLocalCacheEntry(cacheKey);
  if (cached) return cached.stats;
  if (!prevTagName) return null;
  const compareUrl = `${baseUrl}/compare/${prevTagName}...${tagName}`;
  const compare = await fetchGithub<GitHubCompareResponse>(compareUrl, githubToken);
  if (!compare?.files) return null;
  const stats: ChangelogStats = {
    additions: compare.files.reduce((sum, f) => sum + (f.additions ?? 0), 0),
    deletions: compare.files.reduce((sum, f) => sum + (f.deletions ?? 0), 0),
  };
  const entry = { stats, timestamp: Date.now() };
  setLocalCacheEntry(cacheKey, entry);
  await setSharedCacheEntry(cacheKey, entry);
  return stats;
};
const buildReleaseItems = async (
  releases: GitHubRelease[],
  limit: number = changelogConfig.RELEASE_LIMIT,
  baseUrl: string,
  githubToken?: string
): Promise<ChangelogItem[]> => {
  const validReleases = releases.filter((release) => !release.draft).slice(0, limit);
  type ReleaseItemData = {
    date: string;
    label: string;
    bullets: ChangelogBullet[];
    tagName: string | undefined;
    prevTagName: string | undefined;
  };
  const releaseData: ReleaseItemData[] = [];
  for (let i = 0; i < validReleases.length; i++) {
    const release = validReleases[i];
    if (!release) continue;
    const date = (release.published_at || release.created_at || '').slice(0, 10);
    const label = cleanText(release.name || release.tag_name || '');
    const rawBullets = extractReleaseBullets(release.body);
    const bullets: ChangelogBullet[] = rawBullets
      .map((b) => ({ text: toSentence(b) }))
      .filter((b) => b.text)
      .slice(0, changelogConfig.MAX_BULLETS_PER_GROUP);
    if (!bullets.length && label) {
      bullets.push({ text: toSentence(label) });
    }
    const tagName = release.tag_name ?? undefined;
    const prevRelease = validReleases[i + 1];
    const prevTagName = prevRelease?.tag_name ?? undefined;
    if (date && bullets.length) {
      releaseData.push({ date, label, bullets, tagName, prevTagName });
    }
  }
  const statsPromises = releaseData.map((data) =>
    data.tagName && data.prevTagName
      ? fetchReleaseStats(data.tagName, data.prevTagName, baseUrl, githubToken)
      : Promise.resolve(null)
  );
  const statsResults = await Promise.all(statsPromises);
  return releaseData.map((data, i) => ({
    date: data.date,
    label: data.label || undefined,
    bullets: data.bullets,
    stats: statsResults[i] ?? undefined,
  }));
};
type ProcessedCommit = {
  sha: string;
  date: string;
  bullet: string;
};
const buildCommitItems = async (
  commits: GitHubCommitListItem[],
  limit: number,
  baseUrl: string,
  githubToken?: string
): Promise<ChangelogItem[]> => {
  const processed: ProcessedCommit[] = [];
  for (const commit of commits) {
    if (processed.length >= limit) break;
    const bullet = normalizeCommitMessage(commit.commit?.message ?? '');
    if (!bullet) continue;
    const date = commit.commit?.author?.date || commit.commit?.committer?.date || '';
    const day = date.slice(0, 10);
    const sha = commit.sha;
    if (!day || !sha) continue;
    processed.push({ sha, date: day, bullet });
  }
  const statsToFetch = processed.slice(0, changelogConfig.MAX_STATS_FETCHES);
  const statsMap = new Map<string, ChangelogStats>();
  const settledResults = await Promise.allSettled(
    statsToFetch.map(async ({ sha }) => {
      const stats = await fetchCommitStats(sha, baseUrl, githubToken);
      return { sha, stats };
    })
  );
  for (const result of settledResults) {
    if (result.status === 'fulfilled' && result.value.stats) {
      statsMap.set(result.value.sha, result.value.stats);
    }
  }
  const grouped = new Map<string, ChangelogItem>();
  for (const { sha, date, bullet } of processed) {
    const existing = grouped.get(date) ?? {
      date,
      bullets: [],
      stats: { additions: 0, deletions: 0 },
    };
    if (existing.bullets.length < changelogConfig.MAX_BULLETS_PER_GROUP) {
      const commitStats = statsMap.get(sha);
      existing.bullets.push({
        text: bullet,
        stats: commitStats,
      });
      if (commitStats && existing.stats) {
        existing.stats.additions += commitStats.additions;
        existing.stats.deletions += commitStats.deletions;
      }
      grouped.set(date, existing);
    }
  }
  return Array.from(grouped.values()).map((item) => ({
    ...item,
    stats: item.stats?.additions || item.stats?.deletions ? item.stats : undefined,
  }));
};
export default defineEventHandler(async (event): Promise<ChangelogResponse> => {
  setResponseHeaders(event, { 'Cache-Control': 'public, max-age=300, s-maxage=300' });
  try {
    const runtimeConfig = useRuntimeConfig(event);
    const githubToken = runtimeConfig.githubToken;
    const { baseUrl } = getGitHubConfig(runtimeConfig);
    const query = getQuery(event);
    const limit = clamp(
      parseNumber(query.limit, changelogConfig.DEFAULT_LIMIT),
      1,
      changelogConfig.MAX_LIMIT
    );
    const releaseLimit = clamp(parseNumber(query.releases, changelogConfig.RELEASE_LIMIT), 1, 10);
    const releaseUrl = `${baseUrl}/releases?per_page=${releaseLimit}`;
    const releases = await fetchGithub<GitHubRelease[]>(releaseUrl, githubToken);
    const releaseItems = Array.isArray(releases)
      ? await buildReleaseItems(releases, releaseLimit, baseUrl, githubToken)
      : [];
    if (releaseItems.length) {
      return { source: 'releases', items: releaseItems, hasMore: false };
    }
    const fetchLimit = limit + 1;
    const commitFetchCount = Math.min(fetchLimit * 4, 100);
    const commitUrl = `${baseUrl}/commits?per_page=${commitFetchCount}`;
    const commits = await fetchGithub<GitHubCommitListItem[]>(commitUrl, githubToken);
    const commitItems = Array.isArray(commits)
      ? await buildCommitItems(commits, fetchLimit, baseUrl, githubToken)
      : [];
    const hasMore = commitItems.length > limit;
    const items = hasMore ? commitItems.slice(0, limit) : commitItems;
    return { source: 'commits', items, hasMore };
  } catch (error) {
    logger.error('[Changelog] Failed to build changelog.', {
      error: error instanceof Error ? error.message : String(error),
    });
    return { source: 'commits', items: [], hasMore: false, error: 'Failed to fetch changelog' };
  }
});
