---
name: architecture
description: |
  Code architecture: endpoint factory pattern, state management, routing,
  HTTP layer, and module structure — for the apps/* + packages/* monorepo.
  Read before writing or editing any endpoint, module, route, or shared package.
---

# Architecture

See `ARCHITECTURE.md` at the repo root first — this skill covers the same ground with more
implementation-level convention detail for day-to-day edits.

## Backend — go through a real source of truth, not memory

If this project has a backend repo, **never trust a local clone or your own memory of its shape.**
Read the actual routes/serializers/models (or its OpenAPI spec, via the `swagger-api` skill) before
writing or editing an endpoint definition. Add the specific discovery commands for your backend to
the `project` skill once you have one — e.g.:

```bash
gh api repos/<org>/<backend-repo>/contents/<app>/urls.py --jq '.content' | base64 -d
gh api repos/<org>/<backend-repo>/contents/<app>/serializers.py --jq '.content' | base64 -d
```

**Copy field names and enum strings verbatim** from the backend — never invent them from intuition.

## Repo shape

```
apps/*      — deployable apps, each its own port / IdP client / route tree
packages/*  — shared packages (@starter/* scope)
```

**Hard invariant: apps never import apps.** If two apps need the same page or logic, extract it into
`packages/*` — never a cross-app import.

`pnpm-workspace.yaml` globs `apps/*` and `packages/*`; Turbo discovers tasks by script name. Adding
a new app or package needs no separate registration — just the directory and a `package.json` with
matching script names (`dev`, `build`, `typecheck`, `lint`). See `ARCHITECTURE.md`'s "Multi-app
usage" section for the full checklist.

A page/module moves from an app into `packages/*` only when **two or more apps** need it unmodified
or need the same domain API/types. A module that's genuinely one app's concern stays under that
app's `src/features/` (or `src/modules/`), even if it looks reusable in the abstract — don't
pre-emptively extract.

---

## Endpoint factory pattern

### File conventions

- **Naming**: `<domain>-api.ts` or `src/api/<domain>.ts` — e.g. `todos-api.ts`.
- **Location**: `apps/<app>/src/api/<domain>.ts` for app-local domains, or
  `packages/<domain>/src/api.ts` for a domain shared across apps.
- **One file per domain** — no splitting endpoints across files for the same domain.
- **Pure declarations only** — types + query keys + endpoint defs. No hooks, no `createService`
  calls, no `useEffect`.
- **`as const`** on both the key factory AND the endpoints object (required for `invalidateQueries`
  typing).

### Three-layer structure (top to bottom)

#### 1. Types — response shapes from the API

Types live in `types/<domain>.ts` (app-local) or directly in the package's `types.ts` (shared
package), never inline in endpoint files.

```ts
// apps/<app>/src/types/<domain>.ts, or packages/<pkg>/src/types.ts
export interface Todo {
  id: string;
  title: string;
  completed: boolean;
}
```

For paginated lists, define a shared envelope type once in `@starter/types` and reuse it — don't
redefine it per module:

```ts
import type { PaginatedEnvelope } from '@starter/types';

// PaginatedEnvelope<T>: { success, data: T[], meta: { count, next, previous, page, page_size } }
```

#### 2. Query key factory

```ts
export const todosKeys = {
  all: ['todos'] as const,
  lists: () => [...todosKeys.all, 'list'] as const,
  detail: () => [...todosKeys.all, 'detail'] as const,
} as const;
```

- `all` — single string, the domain name. Used for broad invalidation.
- Leaf keys — functions returning `[...parent, 'suffix']`. Passed to `queryKey` in the endpoint def.
- **IDs do NOT go in the key factory.** The hook appends `args?.params` at runtime.
- **`as const`** on the object so each leaf is a readonly tuple.

#### 3. Endpoint definitions

### API versioning — baseURL only, never in endpoint paths

The API version (e.g. `v1`) lives at the app's own API client instantiation, never in endpoint
paths. Every app builds its own client in `apps/<app>/src/config/api.ts`:

```ts
// apps/<app>/src/config/api.ts
import { authStore, createApiClient } from '@starter/api-client';

import { env } from './env';

export const api = createApiClient({
  baseURL: `${env.apiUrl}/v1`,
  getToken: authStore.getToken,
  onRefresh: authStore.runRefresh,
  onAuthError: authStore.runAuthError,
});
```

Mounted app-wide via `<ApiClientProvider client={api}>` in `main.tsx`, so
`useQueryEndpoint`/`useMutationEndpoint` default to it.

Endpoint paths are relative to that base:

```ts
export const todosEndpoints = {
  list: GET<PaginatedEnvelope<Todo>>({
    path: '/todos', // resolves to <baseURL>/v1/todos
    queryKey: todosKeys.lists(),
  }),
} as const;
```

**HTTP verb helpers** (from `@starter/api-client`):

| Helper                       | Generics                      | Body? |
| ---------------------------- | ----------------------------- | ----- |
| `GET<TRes, TQuery>`          | Response type, Query params   | No    |
| `POST<TRes, TBody, TQuery>`  | Response, Request body, Query | Yes   |
| `PATCH<TRes, TBody, TQuery>` | Response, Request body, Query | Yes   |
| `PUT<TRes, TBody, TQuery>`   | Response, Request body, Query | Yes   |
| `DELETE<TQuery>`             | void, Query only              | No    |

**`path`** — static string or function `(params) => string`.

**`queryKey`** — always the corresponding key from the factory. The hook appends `args?.params` +
`args?.query` at call time.

**`invalidates`** — array of query keys to bust on successful mutation. Only on mutations.
`useMutationEndpoint` reads this automatically.

### How to consume in components

```tsx
import { useQueryEndpoint, useMutationEndpoint } from '@starter/api-client';

// Query
const { data, isLoading } = useQueryEndpoint(todosEndpoints.list);

// With path params
const { data } = useQueryEndpoint(todosEndpoints.detail, { params: { id: String(id) } });

// Mutation
const { mutateAsync: remove, isPending } = useMutationEndpoint(todosEndpoints.remove, {
  toast: { onSuccess: [{ condition: () => true, title: 'Deleted', variant: 'success' }] },
});
```

### Pitfalls

1. **Don't put record IDs in the key factory.** The hook appends params at runtime.
2. **Don't call `createService` in components.** Use the generic hooks.
3. **Never wrap `useQueryEndpoint`/`useMutationEndpoint`** unless the wrapper adds real
   transformation.
4. **`invalidates` must reference factory functions**, not literal arrays.
5. **Mutations affecting multiple domains** — put every affected key in `invalidates`.
6. **Path params must be `String(...)`** — the type is `Record<string, string>`.
7. **`useQueryEndpoint` with `undefined` endpoint = idle query.**
8. **Don't import `import.meta.env` in endpoint files.** Use `@/config/env` (app-local).
9. **Never put API version schemes in path strings.**
10. **Don't hand-roll a second API client per module.** Every module's endpoints target the one
    client wired into `<ApiClientProvider>`, unless there's a genuinely separate backend service
    (pass its own `client` explicitly to the hook).

---

## State management

Use zustand with **individual selectors**. Never full-destructure a store.

```ts
// Correct
const count = useCounterStore((s) => s.count);

// Wrong — full destructure causes unnecessary re-renders
const { count } = useCounterStore();
```

Client-state stores are app-local (`apps/<app>/src/stores/*`), imported via the `@/stores` barrel.
Promote a store to `packages/*` only if 2+ apps genuinely share the same state.

---

## Routing

- react-router v7, lazy-loaded modules, **one `createBrowserRouter` per app**
  (`apps/<app>/src/routes/router.tsx`).
- Route constants live app-local, always spread with any shared route constants your auth package
  exposes (e.g. `GLOBAL_ROUTES` if you add one to `@starter/auth`).
- Per-module route files (`apps/<app>/src/routes/<domain>-routes.tsx`) export a
  `RouteObject[]`-returning function, composed into `router.tsx`'s children array — don't inline
  every `lazy()` call directly in `router.tsx` itself, it trips the
  `react-refresh/only-export-components` lint rule (a file exporting both a non-component `router`
  and component-shaped `lazy()` consts).
- No placeholder/coming-soon routes — a route either has a real page or doesn't exist (use
  `PlaceholderPage` from `@starter/ui` only for genuinely mid-port pages, not as a permanent
  fixture).

### Lazy loading

```tsx
// apps/<app>/src/routes/<domain>-routes.tsx
import { lazy } from 'react';
import type { RouteObject } from 'react-router';

import { ROUTES } from '@/constants/routes';

const SomePage = lazy(() => import('@/features/<domain>/pages/SomePage'));

export function DomainRoutes(): RouteObject[] {
  return [{ path: ROUTES.SOME_PAGE, element: <SomePage /> }];
}
```

---

## HTTP layer

Lives in `@starter/api-client` (see `ARCHITECTURE.md`'s full export table):

| Export                                             | Purpose                                                                                         |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `createApiClient(opts)`                            | Builds an app's axios instance (baseURL, token getter, refresh/auth-error handlers)             |
| `GET`, `POST`, `PATCH`, `PUT`, `DELETE`            | Endpoint-definition helpers                                                                     |
| `createService(endpoint, client)`                  | Imperative call helper                                                                          |
| `useQueryEndpoint`, `useMutationEndpoint`          | React Query integration hooks                                                                   |
| `ApiError`, `normalizeApiError`, `apiErrorMessage` | Typed error handling                                                                            |
| `authStore`                                        | In-memory OIDC token store + refresh/auth-error dispatch, fed by `@starter/auth`'s token bridge |
| `ApiClientProvider`                                | Context provider — mount once near the root                                                     |
| `createQueryClient`                                | Shared React Query client factory                                                               |
| `createEnv`                                        | zod-schema env-var loader, used by every app's `config/env.ts`                                  |

Each app instantiates its own client(s) in `apps/<app>/src/config/api.ts` — there is no single
shared client instance across apps, only shared _plumbing_.

### Toast config on hooks

```tsx
const query = useQueryEndpoint(endpoint, args, {
  toast: {
    onError: [{ condition: () => true, title: 'Failed to load', variant: 'error' }],
  },
});
```

Each entry is `{ condition, title, variant }`. `title` can be a static string or a function. Pure
side-effect toasts belong in `toast`; state cleanup stays in its own `useEffect`.

---

## Module structure

Every feature lives in `apps/<app>/src/features/<domain>/` (app-local) with this layout:

```
apps/<app>/src/features/<domain>/
  pages/             ← thin page shells (one file = one route)
  components/        ← UI components + modals + form configs + table configs
  index.ts           ← barrel (pages/index.ts and components/index.ts too, per subdir)
```

App-level API definitions live in `apps/<app>/src/api/<domain>.ts` (see endpoint factory pattern
above).

When a domain is genuinely shared across two or more apps, it gets promoted to
`packages/<domain>/src/` instead, following the shared-package convention: `package.json`
`"exports": {".": "./src/index.ts"}`, `tsconfig.json` extends `@starter/tsconfig/react-lib.json`,
`eslint.config.js` re-exports `@starter/eslint-config/react` (has JSX) or `@starter/eslint-config`
(pure logic). See `ARCHITECTURE.md`'s "Multi-app usage" for the full package-promotion checklist.

Key conventions:

| Concern        | Location                                                                       |
| -------------- | ------------------------------------------------------------------------------ |
| Modals         | `components/` (not a separate `modals/` folder) unless there are many          |
| Form schemas   | `forms/` companion file for each modal (not inlined in the modal)              |
| Pages          | Thin — just export a `function Component()` (or default export) that delegates |
| Barrel exports | Every subdirectory has `index.ts`                                              |
| Config         | `apps/<app>/src/config/{api,env}.ts`, app-local, never shared                  |
