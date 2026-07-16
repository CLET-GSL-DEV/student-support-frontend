---
name: project
description: |
  Repo orientation: pnpm monorepo shape, stack, env, auth, hard rules, git rules.
  Read this before any other skill when starting a new session.
---

# Project Context

## Repo shape: pnpm + Turborepo monorepo

`apps/*` (one or more deployable apps — starts with `apps/web`) + `packages/*` (shared `@starter/*`
packages). See `ARCHITECTURE.md` at the repo root for the full package/app inventory and the
endpoint-factory pattern. **Apps never import apps** — only `packages/*` is shared; if you're
tempted to import one app's code from another, the code belongs in a package instead.

Every command below runs from the repo root via Turbo, or scoped to one workspace with `--filter`:

```bash
pnpm dev --filter @starter/web    # one app's dev server
pnpm typecheck                     # whole workspace, via turbo
pnpm typecheck --filter @starter/ui # one package/app in isolation
pnpm lint
pnpm build
```

## Stack

| Layer           | Tech                                                                                             |
| --------------- | ------------------------------------------------------------------------------------------------ |
| Framework       | React 19 + TypeScript 6                                                                          |
| Build           | Vite 8 (Rolldown bundler under the hood — shows as "vite build" in logs)                         |
| Styling         | Tailwind v4 with design tokens via `@theme` in `packages/tailwind-config`                        |
| UI library      | `@rfdtech/components` (2.0+, installed from npm)                                                 |
| Routing         | react-router v7 (lazy-loaded), one `createBrowserRouter` per app                                 |
| Server state    | `@tanstack/react-query` v5, via `@starter/api-client`'s `useQueryEndpoint`/`useMutationEndpoint` |
| Client state    | zustand v5, app-local stores under `src/stores/*`                                                |
| Forms           | react-hook-form + zod + @hookform/resolvers                                                      |
| HTTP            | axios, wrapped by `@starter/api-client`                                                          |
| Icons           | lucide-react only                                                                                |
| Dates           | date-fns                                                                                         |
| Package manager | **pnpm only** (`packageManager` pinned in root `package.json` — never bun, npm, or yarn)         |

## Hard rules

1. **Package manager**: `pnpm` only. `pnpm add <pkg> --filter @starter/<app>`, `pnpm install` (run
   after adding any new `workspace:*` dependency, to link it), `pnpm dev --filter @starter/<app>`,
   `pnpm typecheck` / `pnpm lint` / `pnpm build`.
2. **Typecheck**: run `pnpm typecheck` (whole workspace) or `pnpm typecheck --filter @starter/<x>`
   (scoped) after every code-edit session. Fix before reporting done. Same for `pnpm lint` — 0
   errors required, pre-existing warnings are tolerable if unrelated to your change.
3. **No emojis** in code, docs, comments, or commits. Use lucide-react icons.
4. **No inline `style={{}}`**. Use Tailwind arbitrary values like `h-[calc(100vh-80px)]`.
5. **No screenshots** (via Playwright MCP or any tool). Use DOM snapshots or console logs.
6. **No leftover files** in project tree after any browser action, download, or export — and no
   leftover `dist/`, `coverage/`, `.turbo/` (app-level) directories after any build/verification
   step. Delete them once you're done checking.
7. **Confidence rule**: before any action, give yourself a 0-100 confidence score. If < 85, ask a
   clarifying question. Proceed only at 85+.
8. **Use `.local.*` prefix** for any config/env/notes files you create on disk (already in
   `.gitignore`). Never use `*.local` suffix.
9. **No em dashes** in UI labels, descriptions, breadcrumbs, or comments.

## Environment variables

Every env var is defined **per app**, in `apps/<app>/src/config/env.ts` (zod schema via
`@starter/api-client`'s `createEnv`). No file touches `import.meta.env` except that one file, per
app.

```ts
// apps/<app>/src/config/env.ts
import { z } from 'zod';

import { createEnv } from '@starter/api-client';

const envSchema = z.object({
  VITE_API_URL: z.string().url().default('http://localhost:3000/api'),
  VITE_ZITADEL_AUTHORITY: z.string().url(),
  VITE_ZITADEL_CLIENT_ID: z.string().default(''),
  VITE_ZITADEL_REDIRECT_URI: z.string().url(),
  VITE_ZITADEL_POST_LOGOUT_URI: z.string().url(),
  // ...
});

export const env = {/* mapped, typed, validated fields */};
```

```ts
import { env } from '@/config/env';

const url = env.apiUrl; // typed, validated, never undefined
```

### Adding a new env var

1. `apps/<app>/src/config/env.ts` — add to the zod schema, add to the exported `env` object
2. `apps/<app>/.env.example` — add with comment
3. `apps/<app>/src/vite-env.d.ts` — add to `ImportMetaEnv` interface
4. If every app needs it, repeat across all `apps/*` — there's no shared env schema

## Auth — ZITADEL OIDC out of the box

`@starter/auth` ships Authorization Code + PKCE via `@zitadel/react-auth` (see `ARCHITECTURE.md`'s
Auth section for `GslAuthProvider`/`useAuth`/`ProtectedRoute`). Swap the IdP for your own by
replacing `packages/auth/src/config.ts` and `GslAuthProvider.tsx` — the rest of the package
(`ProtectedRoute`, `useAuth`, `AuthTokenBridge`, `authStore` wiring in `@starter/api-client`) is
IdP-agnostic as long as the replacement exposes the same shape (`signinRedirect`, `signoutRedirect`,
`isAuthenticated`, `getAccessToken`).

Each app owns its own `/login` + OIDC callback routes.

## Git rules

### NEVER

- Push to main. EVER.
- Commit AI-related files (AGENTS.md if generated, `.playwright-mcp/`, etc.) if they're meant to
  stay local — check `.gitignore`.
- `git add -A` blindly — check what you're staging first.
- Push without explicit user command ("push").

### Always

- **Commit locally after every step.** Auto-commit with a descriptive message. No asking.

  ```bash
  git add {files-that-changed} && git commit -m "step: {what was done}"
  ```

  Never `git add -A` — stage only the files you actually changed. Skip junk.

- Verify user claims against actual code diffs.
- Never push automatically — only when user says "push" verbatim.

### Push flow — squash to single commit

When user says "push":

1. Preserve local commit history in a backup branch.
2. Squash everything since last remote sync + any unstaged changes into **one** commit.
3. Push that single squashed commit to remote.
4. Local granular commits remain intact (backup branch or soft-reset restore).

```bash
# Example push sequence
git branch backup/commits-$(date +%s)         # save local history
git reset --soft origin/$(current_branch)      # squash to staged
git commit -m "feat: {summary of all changes}" # one remote commit
git push origin $(current_branch)
```

### Git Safety Extension — protect user work

Assume every uncommitted change is valuable — the repo may contain unrelated work from the user or
other agents.

**Rule 1 — No repo-wide destructive ops** Forbidden unless user explicitly requests:
`git reset --hard`, `git checkout .`, `git restore .`, `git clean`, `git reset HEAD .`,
`git restore --staged .`, or any equivalent.

**Rule 2 — Always scope destructive ops** Target only affected files.
`git restore --staged packages/auth/login.ts` correct, `git restore .` incorrect.

**Rule 3 — Never undo work outside the current task** If you changed `src/auth.ts`, don't touch any
other file.

**Rule 4 — Commit before changing tasks** After every instruction: review diff, stage only changed
files, commit, continue. Never start new work with unrelated uncommitted changes.

**Rule 5 — Prefer history over deletion** If a mistake was committed: `git revert` or a corrective
commit. No history rewriting unless explicitly requested.

**Rule 6 — If uncertain, stop** Unsure if a git command could discard unrelated work? Don't run it.
Ask.

### 3-strike rule

If the user insists on something that doesn't match reality, ask 3 consecutive times. Only proceed
after the 3rd explicit "yes".

### Commit message styles

```
step: {what was done in this step}              # local (per-step)
feat: {feature} with {key aspects}              # remote (squashed)
fix: {what was broken} / {how it was fixed}
refactor: {what changed} / {why}
chore: {housekeeping}
```

### PR format

```
## New
- ComponentName — one-line description

## Improvements
- ComponentName: what changed (human language)

## Fixes
- ComponentName: bug description and fix

## Cleanups
- What was cleaned up (terse)
```

## Source of truth for a real backend

This starter ships with no fixed backend — endpoints in `apps/*/src/api/` are examples. Once you
have a real backend repo, add a short section here (or a new skill) describing how to discover its
routes/serializers/schema authoritatively (e.g. `gh api repos/<org>/<backend-repo>/...`, or its
OpenAPI spec — see the `swagger-api` skill) so future sessions verify field names and enum values
against the real source instead of guessing. See `api-integration` for the 4-layer sync discipline
this matters for.
