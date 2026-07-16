# Contributing

## Prerequisites

- Node `>=22` (see `.nvmrc` — run `nvm use`)
- pnpm `>=11` (`corepack enable` picks up the pinned version)

## Workflow

1. Branch off `main`: `git checkout -b feat/<scope>-<short-desc>`.
2. Make your change. Add/adjust tests (`*.test.ts[x]` next to the code).
3. Run the gates locally:
   ```bash
   pnpm lint && pnpm typecheck && pnpm test
   ```
4. Commit using **Conventional Commits** — commitlint runs on `commit-msg`:
   ```
   feat(web): add user management page
   fix(api-client): retry refresh only once per request
   chore(deps): bump vite to 8.1
   ```
   Allowed scopes:
   `root, ui, api-client, auth, utils, types, hooks, config, web, ci, deps, release`.
5. Push and open a PR. Fill in the PR template; CI (lint/typecheck/test/build + audit + CodeQL +
   SonarQube quality gate) must pass.

## Git hooks

Installed automatically via `pnpm install` (Husky `prepare` script):

- **pre-commit** → `lint-staged` (ESLint `--fix` + Prettier on staged files)
- **commit-msg** → commitlint

## Where things go

- App-specific UI/state/routes → `apps/<app>/src/features/*`
- Anything shared by 2+ apps → a `packages/*` package (see `ARCHITECTURE.md`'s "Multi-app usage")
- Client state → app-local Zustand store under `src/stores/*`, imported via the `@/stores` barrel
- Server state → declarative endpoints (`GET`/`POST`/...) in `packages/api-client`, consumed via
  `useQueryEndpoint`/`useMutationEndpoint` (see `ARCHITECTURE.md`)

## Security expectations

- Never commit secrets. Only `VITE_`-prefixed values belong in `.env.example`.
- Validate all new env vars in the app's `config/env.ts` Zod schema.
- Keep access tokens in the in-memory `authStore` — do not persist them to storage.
