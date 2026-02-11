import { defineVitestProject } from '@nuxt/test-utils/config';
import { configDefaults } from 'vitest/config';
import { SHARED_DEFINE } from './vitest.shared';
export default defineVitestProject({
  test: {
    name: 'nuxt',
    environment: 'nuxt',
    globals: true,
    setupFiles: ['./tests/test-setup.ts'],
    include: ['app/pages/**/__tests__/**/*.test.ts', 'app/server/**/__tests__/**/*.test.ts'],
    exclude: [...configDefaults.exclude, 'workers/**'],
    clearMocks: true,
    logHeapUsage: false,
    isolate: false,
    maxWorkers: process.env.CI ? 2 : 8,
    pool: 'threads',
  },
  define: SHARED_DEFINE,
});
