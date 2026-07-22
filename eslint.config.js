// Root ESLint config so `eslint --fix` resolves from the repo root (used by the
// lint-staged pre-commit hook). Each package/app also has its own eslint.config.js;
// `turbo run lint` uses those. This one is the fallback for root-level tooling.
import { reactConfig } from '@starter/eslint-config/react';

// Supabase Edge Functions are Deno (own runtime + globals) and live outside any
// app tsconfig, so the frontend's typed linting can't — and shouldn't — cover
// them. Ignore the whole supabase/ tree here (the lint-staged pre-commit hook
// resolves from this root config).
export default [{ ignores: ['supabase/**'] }, ...[reactConfig].flat()];
