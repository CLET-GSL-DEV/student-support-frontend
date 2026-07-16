// Root ESLint config so `eslint --fix` resolves from the repo root (used by the
// lint-staged pre-commit hook). Each package/app also has its own eslint.config.js;
// `turbo run lint` uses those. This one is the fallback for root-level tooling.
import { reactConfig } from '@starter/eslint-config/react';

export default reactConfig;
