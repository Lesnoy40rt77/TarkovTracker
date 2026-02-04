import { resolve } from 'node:path';
import { enableAutoUnmount } from '@vue/test-utils';
import 'fake-indexeddb/auto';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
const MANIFEST_MODULE_ID = resolve(
  process.cwd(),
  'node_modules/nuxt/dist/app/composables/manifest.js'
);
vi.doMock(MANIFEST_MODULE_ID, () => ({
  getAppManifest: () => Promise.resolve({}),
  getRouteRules: () => ({}),
}));
type FetchInput = string | Request | URL;
type MockFetchResponse =
  | { data: { playerLevels: unknown[] } }
  | { data: { hideoutStations: unknown[] } }
  | { data: { prestige: unknown[] } }
  | { data: { items: unknown[] } }
  | { data: { tasks: unknown[]; maps: unknown[]; traders: unknown[] } }
  | { data: { tasks: unknown[] } }
  | { data: { lastPurgeAt: null } }
  | { editions: Record<string, unknown> }
  | {
      matcher: {
        dynamic: Record<string, unknown>;
        static: Record<string, unknown>;
        wildcard: Record<string, unknown>;
      };
      prerendered: unknown[];
      routes: { entries: () => unknown[] };
    };
const getFetchUrl = (input: FetchInput): string => {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return input.url;
};
const mockFetch = vi.fn(
  async (input: FetchInput, _init?: RequestInit): Promise<MockFetchResponse> => {
    const url = getFetchUrl(input);
    if (url.includes('/api/tarkov/bootstrap')) {
      return { data: { playerLevels: [] } };
    }
    if (url.includes('/api/tarkov/hideout')) {
      return { data: { hideoutStations: [] } };
    }
    if (url.includes('/api/tarkov/prestige')) {
      return { data: { prestige: [] } };
    }
    if (url.includes('/api/tarkov/items')) {
      return { data: { items: [] } };
    }
    if (url.includes('/api/tarkov/tasks-core')) {
      return { data: { tasks: [], maps: [], traders: [] } };
    }
    if (url.includes('/api/tarkov/tasks-objectives')) {
      return { data: { tasks: [] } };
    }
    if (url.includes('/api/tarkov/tasks-rewards')) {
      return { data: { tasks: [] } };
    }
    if (url.includes('/api/tarkov/cache-meta')) {
      return { data: { lastPurgeAt: null } };
    }
    if (url.includes('tarkov-data-overlay') || url.includes('/overlay.json')) {
      return { editions: {} };
    }
    if (url.includes('/_nuxt/builds/meta/')) {
      // Mock Nuxt's build manifest requests during test initialization
      return {
        matcher: {
          dynamic: {},
          static: {},
          wildcard: {},
        },
        prerendered: [],
        routes: { entries: () => [] },
      };
    }
    // Fail fast for unmatched URLs to maintain test isolation
    throw new Error(`Unmocked fetch call to: ${url}. Add a mock for this URL in test-setup.ts`);
  }
);
vi.stubGlobal('$fetch', mockFetch);
// Auto-unmount VTU wrappers after each test
try {
  enableAutoUnmount(afterEach);
} catch (error) {
  if (!(error instanceof Error && error.message.includes('cannot be called more than once'))) {
    throw error;
  }
}
const cleanupNuxtApp = (): void => {
  if (typeof document !== 'undefined') {
    const containers = document.querySelectorAll('[data-v-app]');
    containers.forEach((container) => {
      const element = container as HTMLElement & { __vue_app__?: { unmount: () => void } };
      element.__vue_app__?.unmount();
      element.removeAttribute('data-v-app');
      delete element.__vue_app__;
      element.innerHTML = '';
    });
  }
  const context = (
    globalThis as typeof globalThis & {
      __unctx__?: { get?: (key: string) => { unset?: () => void } };
    }
  ).__unctx__;
  context?.get?.('nuxt-app')?.unset?.();
};
beforeAll(() => {
  const originalWarn = console.warn.bind(console);
  vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
    const first = args[0];
    if (typeof first === 'string' && first.startsWith('[Icon]')) return;
    originalWarn(...args);
  });
});
afterAll(() => {
  cleanupNuxtApp();
  vi.restoreAllMocks();
});
