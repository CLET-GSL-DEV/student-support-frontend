import { createVitestConfig } from '@starter/vite-config/vitest';

export default createVitestConfig({
  root: import.meta.dirname,
  extend: {
    test: {
      server: {
        deps: {
          inline: [/@rfdtech\/components/],
        },
      },
    },
  },
});
