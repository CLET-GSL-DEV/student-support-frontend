---
name: portals
description: |
  Portal architecture, role model, SRS source, and migration methodology for the
  apps/* + packages/* monorepo split. Read before touching portal routing, roles,
  shared packages, or planning any future app/package restructuring.
---

# EVS Portals — Architecture, Roles & Migration Methodology

## What this is

The original EVS frontend was a single `admin-portal`-shaped app. It was split into 9 role-scoped
apps + 13 shared packages across two passes: Pass 1 scaffolded the 9 app shells (port, ZITADEL
client, role gate each), Pass 2 did the real module migration (moved every page to the portal that
actually uses it, extracted genuinely shared code into `packages/*`, split the verifier app's
public/private mix into two separate apps). This skill is the map back to that work — read it before
touching portal routing, the role model, any `packages/*` package, or planning a future split/merge
of apps.

## SRS — source of truth for roles & requirements

- Location: `~/Downloads/C5_EVS_SRS_v2.0.pdf`.
- **Always read it in full** whenever asked about the SRS, system requirements, or "system context"
  — before answering, not from memory of a prior read.
- If `pdftoppm`/`pdfinfo` aren't installed, `brew install poppler` first (required for the Read tool
  to render PDF pages).
- Defines the authoritative role list, functional requirements (EVS-F01–F10), non-functional
  requirements, data entities, and glossary. Treat it as the source of truth over any inference from
  the codebase alone.
- Key finding it drove this migration: **EVS-F10 "Third-Party Verification Portal & API"** defines a
  **Third-Party Verifier** (public, no Council account — courts, employers, regulators, law firms)
  as a _distinct actor_ from the internal **Verifier (NLEMS/NBES)** staff role. That distinction is
  why `verifier-portal` became two separate apps (public + internal) instead of one app with two
  route trees.

## Package manager — pnpm only

Root `package.json` declares `"packageManager": "pnpm@11.7.0"` — see the `project` skill. Use
`pnpm --filter @starter/<pkg> <script>` for a single package/app, `pnpm <script>` (via Turbo) for
the whole workspace.

## Repo shape: pnpm + Turborepo monorepo

```
apps/*      — 9 deployable apps, each its own port / ZITADEL client / role gate
packages/*  — 13 shared packages (@starter/* scope)
```

**Hard invariant: apps never import apps.** Confirmed zero exceptions, re-grepped repeatedly across
the whole migration. If two portals need the same page or logic, the answer is always to extract it
into `packages/*` — never a cross-app import.

`pnpm-workspace.yaml` globs `apps/*` and `packages/*`; Turbo discovers tasks by script name. Adding
a new app or package needs no separate registration — just the directory and a `package.json` with
matching script names (`dev`, `build`, `typecheck`, `lint`).

## Apps (9)

| App                      | Port | Role gate                                                           | Owns                                                                                                                                                 |
| ------------------------ | ---- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `admin-portal`           | 5180 | `ADMIN`, `SYSTEM_ADMIN`                                             | `users`, `go-live`, `connectors`, `registry` (SchemaAdmin + SLA only), `dashboard` (SystemDashboard only), `profile`                                 |
| `auditor-portal`         | 5181 | `AUDITOR`                                                           | `audit` (all 5 pages — log, target activity, integrity, security, exports)                                                                           |
| `registrar-portal`       | 5182 | `REGISTRAR`                                                         | `registry` (browser/results/SLA, not upload), `fraud`, `legacy` (waves only), audit's `AuditIntegrityPage`, FCA submission view + assessor workspace |
| `accessor-portal`        | 5183 | `INTERNAL_ASSESSOR` **or** `GTEC_ASSESSOR` (dual-role, same origin) | `internal-assessor` (cases + workspace), `gtec` (forwarded applications + detail), role-aware dashboard                                              |
| `verifier-portal`        | 5184 | `VERIFIER`                                                          | internal (staff) credential verification only                                                                                                        |
| `dg-portal`              | 5185 | `DIRECTOR_GENERAL`                                                  | DG decision pages, read-only fraud/audit(security)/go-live views                                                                                     |
| `candidate-portal`       | 5186 | `CANDIDATE`                                                         | candidate dashboard, FCA submission (own cases only), public `/apply` self-registration (outside the role gate)                                      |
| `institution-portal`     | 5187 | `INSTITUTION_OFFICER`                                               | legacy upload console, registry upload portal                                                                                                        |
| `public-verifier-portal` | 5188 | none — public, unauthenticated (SRS EVS-F10)                        | QR scan / PDF upload / reference-number verification, no Council account needed                                                                      |

## Roles (`packages/auth/src/roles.ts`)

```ts
ROLES = {
  ADMIN,
  SYSTEM_ADMIN,
  INSTITUTION_OFFICER,
  AUDITOR,
  REGISTRAR,
  VERIFIER,
  INTERNAL_ASSESSOR,
  GTEC_ASSESSOR,
  CANDIDATE,
  DIRECTOR_GENERAL,
};
```

- **`REGISTRAR` spelling**: was `ROLES.REGISTAR = 'registar'` (typo) until this migration. Renamed
  to `ROLES.REGISTRAR = 'registrar'` — symbol _and_ runtime string value, confirmed safe because the
  actual ZITADEL project role is spelled correctly. `ROLE_ALIASES` keeps `registar: 'registrar'` as
  a backward-compat entry, in case an already-provisioned IAM account still carries the old typo'd
  string.
- `ADMIN` has no distinct identity of its own in practice — it's `system_admin` in all but name (see
  `ROLE_ALIASES.admin`).
- `PORTALS` map (`packages/auth/src/portals.ts`): `role → {label, url}`. Used by
  `RoleBasedRedirectWatcher` (mounted globally via every portal's `AppProviders` `auth` prop) for a
  **cross-origin hard redirect** (`window.location.replace`) when an authenticated user is on the
  wrong portal's origin. `INTERNAL_ASSESSOR` and `GTEC_ASSESSOR` both map to `accessor-portal`'s URL
  (5183) — same origin, so the watcher is a no-op there; the in-app dashboard split is handled
  locally instead (see Dual-role portal pattern below).

## Shared packages (13)

- `@starter/types`, `@starter/auth`, `@starter/ui`, `@starter/api-client`, `@starter/utils`,
  `@starter/hooks` — pre-existing, extended this migration (envelope types,
  `useAssignedInstitution`, `RoleGuard`/`PageSkeleton`/`PageTitle`/`DateDisplay`/`HeaderProfile`/
  `MobileWarningLayout` promoted into `@starter/ui`).
- **`@starter/fca`** (new) — Foreign Credential Assessment domain: `fca-api.ts` + `consent-api.ts` +
  types. Consumed by `accessor-portal`, `dg-portal`, `registrar-portal`, `candidate-portal`.
- **`@starter/verifier`** (new) — verifier domain: types, status utils, `VerificationFailedDialog`,
  `VerificationLoadingModal`, and `api.ts` split into two exported groups — `verifierEndpoints`
  (internal, auth-required) and `publicVerifierEndpoints` (public, no auth). Consumed by
  `verifier-portal` and `public-verifier-portal`.
- `@starter/eslint-config`, `@starter/tsconfig`, `@starter/vite-config`, `@starter/tailwind-config`,
  `@starter/prettier-config` — tooling, unchanged.

**Package convention**: `package.json` `"exports": {".": "./src/index.ts"}`, `"types"` same,
`tsconfig.json` extends `@starter/tsconfig/react-lib.json`, `eslint.config.js` re-exports
`@starter/eslint-config/react` (has JSX) or `@starter/eslint-config` (pure logic), devDeps
`@starter/eslint-config` + `@starter/tsconfig` `workspace:*`. After adding a new `workspace:*`
dependency to any `package.json`, run `pnpm install` to link it — that's the whole "relink" step; no
lockfile hand-editing needed.

## Migration methodology (for a future similar restructuring)

### The per-portal migration pattern

1. **Research pass first, always.** Spawn an Explore agent to map: exact module file inventory
   (which pages/components/services are exclusive to this portal vs. shared with another target),
   cross-module imports, the exact trim scope for every shared file it touches (see below), current
   nav entries visible to the role — grep the **live** `constants/navigation.ts`, never a
   dead/aspirational per-role sidebar file — route constants needed, `package.json` dependency diff,
   and e2e test exposure.
2. **Only after research, spawn an execution agent** with a fully-specified prompt: exact file
   lists, exact trim scope per shared file, exact route paths, the layout/nav pattern to follow
   (below), and required verification steps. Don't delegate the scoping decisions — make them
   yourself from the research, then hand over mechanical execution.
3. **Verify independently after** — don't just trust the agent's self-report. Re-grep for the
   specific things it claimed to have removed or kept.

### Shared-file trimming pattern (recurring, non-obvious)

Files like `registry-api.ts`, `dashboard-api.ts`, `types/dashboard.ts`, and
`constants/data/dashboard.ts` (1708 lines in the original) each backed _multiple_ pages across
_multiple_ roles. When a target portal only needs 2 of 8 dashboard variants, don't copy the whole
file — grep every consuming page's exact import list and cut to that. The same source file often
gets **independently trimmed differently** for different target portals: `registry-api.ts` was
trimmed once for `institution-portal`'s upload-only needs
(`institutionEndpoints.{list,cycles, createCycle}`, `registryEndpoints.{schemas,batches,...}`) and a
second, unrelated time for `registrar-portal`'s browse/query/revoke needs
(`registryEndpoints.{credentials,query,revoke}`, `institutionEndpoints.list`). These are two
independent trims of the same origin file, not a shared extraction — don't try to reconcile them
into one shape.

### Layout/nav pattern per portal

Each single-role portal builds its own **lean** `components/layout/MainLayout.tsx` +
`MainSidebarPanel.tsx` — not a copy of `admin-portal`'s fuller version, which has
`HeaderSearch`/`AppSwitcher`/`AppHeaderNotifications`/`filterNavigation` built for a genuinely
multi-role app. Single-role portals use a **fixed literal nav array**, no role-filtering machinery.
The one exception is `accessor-portal` (dual-role), which needs a role-conditional nav item via
`useAuth().hasRole()`.

### Dual-role portal pattern (`accessor-portal`)

When two roles map to the same portal origin (check `packages/auth/src/portals.ts` for a shared
URL), `RoleBasedRedirectWatcher` does nothing there — it only redirects cross-origin. If the two
roles need genuinely different dashboards (check admin-portal's `ROLE_DASHBOARD_MAP` — if the two
roles resolve to different routes there, they need different pages, not one shared component), build
a small local `ROLE_DASHBOARD_MAP` + `DashboardRedirector` inside that portal (mirroring
admin-portal's own `DashboardRedirector` component), mounted at the shared `/dashboard` entry.

### Dead-link handling — not applied consistently this session

Intended rule: a hardcoded link that's already broken in `admin-portal` today (points nowhere real,
404s there too) can be preserved as-is when porting — no regression. A link to a _real_ page that
simply isn't migrated to this portal must be dropped, not preserved, since the `ROUTES.<X>` constant
won't exist to reference. **This wasn't applied consistently**: `institution-portal` and
`registrar-portal` kept several dead quick-links (parity-preserved); `dg-portal` and
`candidate-portal` dropped or repointed theirs. Flagged, not yet normalized — check current state
before assuming either behavior in a given portal.

### Full-workspace verification discipline

After every unit of migration (one portal, one shared package):
`pnpm --filter @starter/<x> typecheck`, `lint`, `build` in isolation, **then** a full
`pnpm typecheck && pnpm lint && pnpm build` across the whole workspace before moving on — don't
batch multiple portals before checking. Delete `dist/`, `coverage/`, `.turbo/` (app-level, not the
root tracked `.turbo/cache`) after every build — no leftover build artifacts, ever.

### Background-agent operational note: connection drops

Long delegated migration agents (`Agent` tool, `run_in_background: true`) can die mid-task from
transient network errors (`ECONNRESET`, "Connection closed mid-response", `ConnectionRefused`) —
these are infra failures, not agent mistakes. Some agents in this migration needed 2–3 resumes. The
fix is `SendMessage({to: <agentId>, message: "resume from where you left off: <last known step>"})`
— this resumes the agent **from its own transcript**, not from scratch. Always check the failed
agent's last progress note (in the `task-notification`'s `result` field) before writing the resume
message, so it knows exactly where to pick up.

## Known open items (will go stale — verify before relying on this list)

- **`public-verifier-portal` has no ZITADEL client ID provisioned.** `.env.local` ships with
  `VITE_ZITADEL_CLIENT_ID` blank. Needs either a 9th ZITADEL client, or `localhost:5188`'s
  redirect/post-logout URIs added to the existing Verifier client (`381041763936174136`). The app
  boots fine either way — no route requires sign-in — but login and `RoleBasedRedirectWatcher` won't
  work until this is resolved.
- **Dead quick-link handling is inconsistent across portals** — see above.
- **`registrar-portal`'s `AssessorWorkspacePage`** (migrated from `admin-portal` to close a real gap
  — it was never migrated anywhere and registrars would have lost the ability to reach it) is
  **mock-data-driven** (toast + local `setState` against hardcoded `mockCases`), not wired to real
  `@starter/fca` stage-transition mutations. The capability it preserves was always a UI shell in
  the original `admin-portal` too — this isn't a regression introduced by the migration, just
  something to know before expecting it to talk to the real backend.
- **`project` / `architecture` were rewritten to match the monorepo** (pnpm, `apps/*`/`packages/*`
  paths, ZITADEL-not-IAM login flow, per-app `config/env.ts`, the endpoint-factory/routing/module
  conventions above). If you're reading this skill from a much later session and either of those
  looks stale again, trust the live code over any of these three skills — they document a moment in
  time.

## Where to find more detail

This section documents where the original EVS migration's plan doc lived (a session-local artifact,
not part of this repo) — kept as historical record of how that migration was planned and executed.
The full approved migration plan (role→portal table, phase-by-phase execution order, verification
checklist) was at `~/.claude/plans/plan-splitting-into-portals-ticklish-kettle.md` if it's still on
disk — treat it as historical record of _how_ this migration was planned and executed, not as a live
spec (the repo has moved past it).
