import react from '@vitejs/plugin-react';
import path from 'node:path';
import { type ViteUserConfig, mergeConfig } from 'vitest/config';

export interface VitestConfigOptions {
  /** App root — pass `import.meta.dirname`. Drives the `@` alias + setup path. */
  root: string;
  /** Overrides the default `['<root>/vitest.setup.ts']`. */
  setupFiles?: string[];
  /** Extra coverage excludes appended to the shared defaults. */
  coverageExclude?: string[];
  /** Extra config merged on top via vitest's mergeConfig. */
  extend?: ViteUserConfig;
}

/** Shared Vitest config for GSL apps (jsdom + v8 coverage). */
export function createVitestConfig(options: VitestConfigOptions): ViteUserConfig {
  const { root, setupFiles, coverageExclude = [], extend = {} } = options;

  const base: ViteUserConfig = {
    plugins: [react()],
    resolve: {
      alias: { '@': path.resolve(root, 'src') },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: setupFiles ?? [path.resolve(root, 'vitest.setup.ts')],
      css: false,
      // Keep Vitest out of the Playwright e2e specs.
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'lcov'],
        reportsDirectory: './coverage',
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/main.tsx', 'src/**/*.d.ts', 'src/routes/**', ...coverageExclude],
      },
    },
  };

  return mergeConfig(base, extend);
}
