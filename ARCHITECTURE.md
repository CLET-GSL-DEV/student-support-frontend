# Architecture

A pnpm + Turborepo monorepo starter built around three things: a declarative endpoint factory for
server state, `@rfdtech/components` (2.0+) as the design system, and an OIDC (ZITADEL) auth package
— all shareable across one app or many.

## Layout

```
starter/
├── apps/
│   └── web/                  # example app — copy this to add another
├── packages/
│   ├── api-client/           # axios client + endpoint factory + query hooks
│   ├── auth/                 # OIDC auth (ZITADEL), ProtectedRoute, token bridge
│   ├── ui/                   # AppProviders, ErrorBoundary, page-level UI helpers
│   ├── hooks/                # generic React hooks (useMediaQuery, ...)
│   ├── types/                # shared TS types
│   ├── utils/                # cn(), formatDate(), ...
│   ├── tailwind-config/      # preset.css + theme.css (design tokens)
│   ├── eslint-config/        # base + react ESLint configs
│   ├── prettier-config/      # shared Prettier config
│   └── tsconfig/             # base / react-app / react-lib tsconfig bases
├── turbo.json                 # build/lint/typecheck/test/dev pipeline
├── pnpm-workspace.yaml         # apps/* + packages/* globs
└── ARCHITECTURE.md            # this file
```

Everything under `packages/*` is published internally as `@starter/<name>` via pnpm's `workspace:*`
protocol — no build step is required to consume them (`exports` in each `package.json` points
straight at `src/index.ts`; apps compile them as source through Vite/tsc).

## The endpoint factory (`@starter/api-client`)

Server state is modeled as **declarative endpoint definitions**, not ad-hoc fetch calls or
hand-written TanStack Query hooks. This is the "new API system" — the core thing this starter exists
to carry forward.

### 1. Define an endpoint

```ts
// src/api/endpoints.ts
import { DELETE, GET, PATCH, POST } from '@starter/api-client';

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
}

export const todosEndpoints = {
  list: GET<Todo[]>({
    path: '/todos',
    queryKey: ['todos'],
  }),
  get: GET<Todo, never>({
    path: (params) => `/todos/${params.id}`,
    queryKey: ['todos'],
  }),
  create: POST<Todo, { title: string }>({
    path: '/todos',
    invalidates: [['todos']],
  }),
  update: PATCH<Todo, Partial<Todo>>({
    path: (params) => `/todos/${params.id}`,
    invalidates: [['todos']],
  }),
  remove: DELETE({
    path: (params) => `/todos/${params.id}`,
    invalidates: [['todos']],
  }),
};
```

- `path` is a string or a `(params) => string` function for path params.
- `queryKey` doubles as the TanStack Query cache key.
- `invalidates` lists query keys a mutation should invalidate on success.
- `GET`/`POST`/`PATCH`/`PUT`/`DELETE` are typed builders around a single
  `EndpointDef<TRes, TBody, TQuery>` shape — `TRes`/`TBody`/`TQuery` are inferred at the call site,
  no redundant generics.

### 2. Consume it with the hooks

```tsx
import { useMutationEndpoint, useQueryEndpoint } from '@starter/api-client';

import { todosEndpoints } from '@/api/endpoints';

function TodoList() {
  const todos = useQueryEndpoint(todosEndpoints.list);
  const createTodo = useMutationEndpoint(todosEndpoints.create, {
    toast: {
      onSuccess: [{ condition: () => true, title: 'Todo created', variant: 'success' }],
      onError: [{ condition: () => true, title: 'Failed to create todo', variant: 'error' }],
    },
  });

  // todos.data / todos.isLoading / todos.isError — a normal TanStack Query result
  // createTodo.mutate({ body: { title: 'New todo' } })
}
```

- `useQueryEndpoint(endpoint, args?, options?, client?)` wraps `useQuery`. `args.params` fills path
  params, `args.query` becomes the axios `params` (querystring). `options.toast` fires a toast (via
  `@rfdtech/components`'s `useToast`) when `data`/`error` changes and a condition matches — useful
  for background refetch notifications.
- `useMutationEndpoint(endpoint, options?)` wraps `useMutation`, auto-invalidates the endpoint's
  `invalidates` keys on success, and supports the same `toast` config.
- Both hooks resolve their axios client from an explicit `client` argument first, then fall back to
  whatever `<ApiClientProvider client={api}>` provides — see below.

### 3. Wire the axios client once per app

```ts
// src/config/api.ts
import { authStore, createApiClient, getServiceCreator } from '@starter/api-client';

import { env } from './env';

export const api = createApiClient({
  baseURL: env.apiUrl,
  getToken: authStore.getToken,
  onRefresh: authStore.runRefresh,
  onAuthError: authStore.runAuthError,
});
```

```tsx
// src/main.tsx
import { ApiClientProvider } from '@starter/api-client';

import { api } from '@/config/api';

<ApiClientProvider client={api}>
  <RouterProvider router={router} />
</ApiClientProvider>;
```

`createApiClient` wires 401 handling: on a 401 it calls `onRefresh` (silent OIDC renewal) and
retries once; on unrecoverable failure it calls `onAuthError` (redirect to sign-in). `authStore`
holds the access token in memory only — it is never persisted to storage. The bridge between the
OIDC session and `authStore` lives in `@starter/auth`'s `AuthTokenBridge`, mounted by
`GslAuthProvider`.

### Error handling

`normalizeApiError` / `ApiError` / `apiErrorMessage` (from `@starter/api-client`) turn an axios
error into a typed `ApiError` with a stable `type` (`UNAUTHORIZED`, `VALIDATION_ERROR`,
`SERVER_ERROR`, ...) and a display-safe message — use `apiErrorMessage(error)` anywhere you need to
show an error outside a hook's own `isError`/`error` state (e.g. a caught exception in an event
handler).

## Design system (`@rfdtech/components` 2.0+)

Installed from public npm (`@rfdtech/components@^2.0.1`) — no vendored tarball, no private registry
config needed.

- `packages/tailwind-config/preset.css` is the single import an app needs:
  ```css
  @import '@starter/tailwind-config/preset.css';
  ```
  It pulls in Tailwind v4, `@rfdtech/components/style.css` (the component library's own base
  styles + `--gsl-*` token defaults), and `theme.css`.
- `theme.css` **only overrides `--gsl-*` tokens and adds app-level `--brand-*` aliases** — it never
  renames the `--gsl-*` variables or the `data-gsl-theme` attribute, since those are the component
  library's own contract (dark mode is toggled by setting `data-gsl-theme="dark"` on `:root` or a
  `.gsl-theme` element, handled by `<ThemeProvider>` from `@starter/ui`'s `AppProviders`).
- To re-skin the starter for a new brand: edit the `--brand-*` values and the
  `--gsl-primary`/`--gsl-primary-light` overrides in `theme.css`. Everything else (buttons, tables,
  dialogs, forms) inherits from `@rfdtech/components`.
- `@source` directives in `preset.css` scan `packages/ui/src` and `packages/auth/src` so Tailwind
  doesn't purge their utility classes — add another `@source` line if you put markup in another
  shared package.

### `xlsx` peer dependency gotcha

`@rfdtech/components`' `Table` export feature has `xlsx` as a peer dependency, and its bundle
imports it eagerly at module load — not lazily behind the export feature. Any package that
transitively imports from `@rfdtech/components` (including indirectly, e.g. `@starter/auth`'s tests
pull in `@starter/api-client`'s barrel, which imports `useToast` from `@rfdtech/components` in
`api-hooks.ts`) needs `xlsx` resolvable in `node_modules`, even if that package never renders a
`Table`. `packages/auth` and `apps/web` list it explicitly for this reason — add it to any other
package/app that hits a `Cannot find package 'xlsx'` error.

## Auth (`@starter/auth`)

OIDC (ZITADEL) Authorization Code + PKCE, public client (no secret):

- `GslAuthProvider` — mounts the OIDC provider (env-configured) and `AuthTokenBridge` (feeds the
  access token into `authStore` in `@starter/api-client`, and gives `createApiClient` its
  silent-refresh/auth-error callbacks).
- `useAuth()` — `signinRedirect`, `signoutRedirect`, `hasRole`, `user`, ...
- `ProtectedRoute` — a route wrapper: `<ProtectedRoute roles={['user']} redirectTo="/login" />`.
- `AuthCallback` / `LogoutCallback` — mount at your OIDC `redirect_uri` / `post_logout_redirect_uri`
  paths.

Env is validated with Zod via `createEnv` (`@starter/api-client`) — see
`apps/web/src/config/env.ts`. Only `VITE_`-prefixed vars belong in `.env.example`; never commit
secrets (there shouldn't be any — PKCE public clients don't have one).

## Single-app usage

`apps/web` is a complete, working example: routing (`react-router`), auth-gated pages, the endpoint
factory wired end-to-end (`src/api/endpoints.ts` + `Dashboard.tsx`), and an app-local Zustand store
for client state. To start a new project from this starter as a single app:

1. Rename `apps/web` if you want a different app name (update `package.json`'s `name`,
   `sonar-project.properties`' lcov path, and `CONTRIBUTING.md`'s scope list).
2. Replace `src/api/endpoints.ts` with your real resources.
3. Update `theme.css` brand tokens and `public/favicon.svg`.
4. Fill in `.env.example` → `.env` with your API URL and ZITADEL app credentials.
5. `pnpm install && pnpm dev`.

Client state (Zustand, app-local) vs. server state (endpoint factory) split: see `CONTRIBUTING.md`'s
"Where things go" section.

## Multi-app usage

`pnpm-workspace.yaml` already globs `apps/*`, and `turbo.json`'s pipeline
(`build`/`lint`/`typecheck`/`test`/`dev`) runs per-package — adding a second app costs nothing at
the tooling level. To add one:

1. Copy `apps/web` to `apps/<new-app>`.
2. Rename the app's `package.json` `name` to `@starter/<new-app>`.
3. Give it a distinct dev port in `vite.config.ts` and `playwright.config.ts` (`apps/web` uses
   `5290`), and distinct `VITE_ZITADEL_REDIRECT_URI`/`VITE_ZITADEL_POST_LOGOUT_URI` values in
   `.env.example` (each app is typically its own ZITADEL application, or its own role scope on a
   shared one — see `@starter/auth`'s `ProtectedRoute roles={[...]}`).
4. Reuse `packages/*` as-is — that's the point of the split. Only add a new shared package when 2+
   apps need the same code (see `CONTRIBUTING.md`); otherwise keep app-specific code under
   `apps/<new-app>/src/features/*`.
5. Add the new app's `name`/lcov path to `sonar-project.properties` and the scope list in
   `CONTRIBUTING.md` if you use those.
6. `pnpm --filter @starter/<new-app> dev` runs just that app; `pnpm dev` (Turborepo) runs all apps
   in parallel.

If apps need to navigate between each other post-login (a multi-portal setup with role switching
across origins), that's extra plumbing on top of `@starter/auth` — the current package intentionally
stays single-origin/single-app scoped; don't add cross-portal routing here unless you actually need
it.

## Config packages

- `packages/tsconfig` — `base.json` (Node/tooling), `react-app.json` (apps), `react-lib.json`
  (packages). Every `tsconfig.json` in the repo extends one of these.
- `packages/eslint-config` — `index.js` (base) and `react.js` (adds React/hooks rules).
- `packages/prettier-config` — shared Prettier + import-sort config
  (`@trivago/prettier-plugin-sort-imports`, order: react → third-party → `@starter/*` → `@/*` →
  relative).

## CI / hooks

`.github/workflows/ci.yml` runs lint/typecheck/test/build + `pnpm audit` + CodeQL;
`sonar-project.properties` wires a SonarQube quality gate over `apps` + `packages`. Husky installs
on `pnpm install` (`prepare` script): `pre-commit` runs `lint-staged` (ESLint `--fix` + Prettier on
staged files), `commit-msg` runs commitlint (Conventional Commits — see `CONTRIBUTING.md` for the
scope list).
