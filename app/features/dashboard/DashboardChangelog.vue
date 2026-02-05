<template>
  <div class="mb-3">
    <div class="panel px-3 py-2">
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2 text-sm font-semibold text-white">
          <UIcon name="i-mdi-history" class="text-primary-400 h-4 w-4" />
          {{ t('page.dashboard.changelog.title') }}
        </div>
        <div class="flex items-center gap-2">
          <NuxtLink
            to="/changelog"
            class="text-primary-400 hover:text-primary-300 text-xs transition-colors"
          >
            {{ t('page.dashboard.changelog.view_all') }}
          </NuxtLink>
          <span class="text-surface-600">|</span>
          <UButton
            size="xs"
            color="neutral"
            variant="link"
            :aria-controls="PANEL_ID"
            :aria-expanded="isOpen"
            @click="toggleOpen"
          >
            {{ isOpen ? t('page.dashboard.changelog.hide') : t('page.dashboard.changelog.show') }}
          </UButton>
        </div>
      </div>
      <div v-if="isOpen" :id="PANEL_ID" class="mt-2 space-y-3 text-xs sm:text-sm">
        <div v-if="pending" class="text-surface-400 text-xs">
          {{ t('page.dashboard.changelog.loading') }}
        </div>
        <div v-else-if="error" class="text-surface-400 flex items-center gap-2 text-xs">
          <span>{{ t('page.dashboard.changelog.error') }}</span>
          <UButton size="xs" color="neutral" variant="link" @click="retry">
            {{ t('page.dashboard.changelog.retry') }}
          </UButton>
        </div>
        <div v-else-if="showEmpty" class="text-surface-400 text-xs">
          {{ t('page.dashboard.changelog.empty') }}
        </div>
        <div v-else class="space-y-3">
          <div v-for="entry in entries" :key="entry.date" class="space-y-1">
            <div class="text-surface-400 text-[11px] font-semibold tracking-wide uppercase">
              <span>{{ formatDate(entry.date) }}</span>
              <span v-if="entry.label" class="text-surface-500">· {{ entry.label }}</span>
            </div>
            <ul class="text-surface-200 list-disc space-y-1 pl-4">
              <li v-for="(bullet, index) in entry.bullets" :key="index">
                {{ getBulletText(bullet) }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
  import { useI18n } from 'vue-i18n';
  import {
    cleanText,
    extractReleaseBullets,
    normalizeCommitMessage,
    toSentence,
  } from '@/utils/changelog';
  import { logger } from '@/utils/logger';
  import type { ChangelogBullet, ChangelogItem, ChangelogResponse } from '@/types/changelog';
  const PANEL_ID = 'dashboard-changelog-panel';
  const SERVER_CHANGELOG_KEY = 'dashboard-changelog-server';
  const SERVER_CHANGELOG_URL = '/api/changelog';
  const GITHUB_RELEASES_KEY = 'dashboard-changelog-github-releases';
  const GITHUB_COMMITS_KEY = 'dashboard-changelog-github-commits';
  const runtimeConfig = useRuntimeConfig();
  const githubOwner = runtimeConfig.public.githubOwner || 'tarkovtracker-org';
  const githubRepo = runtimeConfig.public.githubRepo || 'TarkovTracker';
  const GITHUB_RELEASES_URL = `https://api.github.com/repos/${githubOwner}/${githubRepo}/releases`;
  const GITHUB_COMMITS_URL = `https://api.github.com/repos/${githubOwner}/${githubRepo}/commits`;
  const { locale, t } = useI18n({ useScope: 'global' });
  const isOpen = ref(false);
  const hasRequested = ref(false);
  const entries = ref<ChangelogItem[]>([]);
  const pending = ref(false);
  const error = ref(false);
  const showEmpty = computed(() => !pending.value && !error.value && entries.value.length === 0);
  const getBulletText = (bullet: ChangelogBullet): string => {
    return typeof bullet === 'string' ? bullet : bullet.text;
  };
  const buildReleaseItems = (releases: Array<Record<string, unknown>>): ChangelogItem[] => {
    return releases
      .filter((release) => release && release.draft !== true)
      .slice(0, 3)
      .map((release) => {
        const date = String(release.published_at || release.created_at || '').slice(0, 10);
        const label = cleanText(String(release.name || release.tag_name || ''));
        const rawBullets = extractReleaseBullets(release.body as string | null | undefined);
        const bullets = rawBullets.map(toSentence).filter(Boolean).slice(0, 5);
        if (!bullets.length && label) {
          bullets.push(toSentence(label));
        }
        return { date, label: label || undefined, bullets };
      })
      .filter((item) => item.date && item.bullets.length);
  };
  const buildCommitItems = (commits: Array<Record<string, unknown>>): ChangelogItem[] => {
    const grouped = new Map<string, ChangelogItem>();
    let total = 0;
    for (const commit of commits) {
      if (total >= 10) break;
      const commitData = (commit?.commit as Record<string, unknown> | undefined) ?? {};
      const bullet = normalizeCommitMessage(commitData.message as string | null | undefined);
      if (!bullet) continue;
      const date =
        (commitData.author as Record<string, unknown> | undefined)?.date ||
        (commitData.committer as Record<string, unknown> | undefined)?.date ||
        '';
      const day = String(date).slice(0, 10);
      if (!day) continue;
      const existing = grouped.get(day) ?? { date: day, bullets: [] };
      if (existing.bullets.length < 5) {
        existing.bullets.push(bullet);
        grouped.set(day, existing);
        total += 1;
      }
    }
    return Array.from(grouped.values());
  };
  const logError = (message: string, err: unknown) => {
    if (err instanceof Error) {
      logger.error(message, { message: err.message, stack: err.stack });
      return;
    }
    logger.error(message, err);
  };
  const serverRequest = useFetch<ChangelogResponse>(SERVER_CHANGELOG_URL, {
    key: SERVER_CHANGELOG_KEY,
    query: { limit: 10 },
    headers: { Accept: 'application/json' },
    immediate: false,
    server: false,
    onResponseError({ response }) {
      logger.error('[DashboardChangelog] fetchServerItems failed.', {
        status: response?.status,
        url: response?.url ?? SERVER_CHANGELOG_URL,
      });
    },
    onRequestError({ error }) {
      logError('[DashboardChangelog] fetchServerItems error.', error);
    },
  });
  const githubReleaseRequest = useFetch<Array<Record<string, unknown>>>(GITHUB_RELEASES_URL, {
    key: GITHUB_RELEASES_KEY,
    query: { per_page: 3 },
    headers: { Accept: 'application/vnd.github+json' },
    immediate: false,
    server: false,
    onResponseError({ response }) {
      logger.error('[DashboardChangelog] fetchGithubItems releases failed.', {
        status: response?.status,
        url: response?.url ?? GITHUB_RELEASES_URL,
      });
    },
    onRequestError({ error }) {
      logError('[DashboardChangelog] fetchGithubItems releases error.', error);
    },
  });
  const githubCommitRequest = useFetch<Array<Record<string, unknown>>>(GITHUB_COMMITS_URL, {
    key: GITHUB_COMMITS_KEY,
    query: { per_page: 40 },
    headers: { Accept: 'application/vnd.github+json' },
    immediate: false,
    server: false,
    onResponseError({ response }) {
      logger.error('[DashboardChangelog] fetchGithubItems commits failed.', {
        status: response?.status,
        url: response?.url ?? GITHUB_COMMITS_URL,
      });
    },
    onRequestError({ error }) {
      logError('[DashboardChangelog] fetchGithubItems commits error.', error);
    },
  });
  const fetchServerItems = async (): Promise<ChangelogItem[] | null> => {
    try {
      await serverRequest.refresh();
      if (serverRequest.error.value) {
        return null;
      }
      const data = serverRequest.data.value;
      if (!data || !Array.isArray(data.items)) {
        logger.error('[DashboardChangelog] fetchServerItems invalid response shape.', {
          data,
          url: SERVER_CHANGELOG_URL,
        });
        return null;
      }
      if (data.error) {
        logger.error('[DashboardChangelog] fetchServerItems response error.', {
          error: data.error,
          url: SERVER_CHANGELOG_URL,
        });
        return null;
      }
      return data.items;
    } catch (err) {
      logError('[DashboardChangelog] fetchServerItems error.', err);
      return null;
    }
  };
  const fetchGithubItems = async (): Promise<ChangelogItem[] | null> => {
    try {
      await githubReleaseRequest.refresh();
      const releases = githubReleaseRequest.error.value ? null : githubReleaseRequest.data.value;
      if (Array.isArray(releases)) {
        const releaseItems = buildReleaseItems(releases);
        if (releaseItems.length) return releaseItems;
      }
      await githubCommitRequest.refresh();
      if (githubCommitRequest.error.value) return null;
      const commits = githubCommitRequest.data.value;
      if (!Array.isArray(commits)) return null;
      return buildCommitItems(commits);
    } catch (err) {
      logError('[DashboardChangelog] fetchGithubItems error.', err);
      return null;
    }
  };
  const loadChangelog = async (force = false) => {
    if (pending.value) return;
    if (hasRequested.value && !force) return;
    entries.value = [];
    pending.value = true;
    error.value = false;
    hasRequested.value = true;
    const serverItems = await fetchServerItems();
    if (serverItems) {
      entries.value = serverItems;
      pending.value = false;
      return;
    }
    const githubItems = await fetchGithubItems();
    if (githubItems) {
      entries.value = githubItems;
      pending.value = false;
      return;
    }
    entries.value = [];
    hasRequested.value = false;
    error.value = true;
    pending.value = false;
  };
  const toggleOpen = () => {
    isOpen.value = !isOpen.value;
  };
  const retry = async () => {
    await loadChangelog(true);
  };
  watch(isOpen, async (open) => {
    if (open) {
      await loadChangelog();
    }
  });
  const formatDate = (date: string): string => {
    if (!date) return '';
    const parsed = new Date(`${date}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toLocaleDateString(locale.value, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    });
  };
</script>
