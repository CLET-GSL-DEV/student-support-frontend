import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import { baseConfig } from './index.js';

/**
 * React app flat config — base rules plus React Hooks + Fast Refresh.
 * Apps spread this and may append project-specific overrides.
 */
export const reactConfig = tseslint.config(...baseConfig, {
  files: ['**/*.{ts,tsx}'],
  extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
  languageOptions: {
    globals: globals.browser,
  },
});

export default reactConfig;
