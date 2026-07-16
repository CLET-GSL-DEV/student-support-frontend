import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts', '**/*.test.ts'],
      // Report-only: the axios/env helpers are exercised through the apps and the
      // SonarQube quality gate enforces overall coverage. The auth store has its
      // own unit test above.
    },
  },
});
