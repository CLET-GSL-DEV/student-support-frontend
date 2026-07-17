# GSL Student Support Frontend

The web Admin Portal for the CLET Student App (System S028), operated by the GSL Student Support
Administrator. It configures what students see in the mobile app: notification content and statutory
categories, scholarship windows, welfare routing rules, hostel allocation rules, and the admissions
status workflow, alongside aggregate analytics, the S003 audit log, and app-store release
governance.

Built against `C3_S028_Student_App_SRS_v1.0.pdf` (repo root). The SRS scopes the Admin Portal but
does not specify it screen by screen, so unspecified detail is built as clearly marked placeholders;
see [ADMIN_PORTAL_TRACEABILITY.md](ADMIN_PORTAL_TRACEABILITY.md) for the full
responsibility-to-screen map, every `// SPEC:` gap, and every `// TODO(integration):` seam.

## Status: frontend-only

There is no live backend yet. Every backend path sits behind a repository interface with two
implementations:

- a mock (the default) serving in-memory dummy data, and
- an Api stub routing through the S026 gateway client via declarative endpoint definitions.

`VITE_ADMIN_DATA_SOURCE` flips between them per environment; `VITE_ADMIN_MOCK_SCENARIO` (`populated`
| `empty` | `error`) drives every screen's loading, empty, and error states without a backend.
Integration is a per-domain flip once real contracts exist.

## Screens

| Route                  | Purpose                                                                         |
| ---------------------- | ------------------------------------------------------------------------------- |
| `/dashboard`           | Aggregate metrics, editable task-level quick actions, aggregate analytics views |
| `/notifications`       | Notification templates and categories; G-02 statutory no-opt-out baseline       |
| `/scholarships`        | Scholarship listings, eligibility parameters, application windows (SA.13)       |
| `/welfare-routing`     | Self-referral routing and escalation rules only; no case data, ever (SA.12)     |
| `/hostel-rules`        | Priority-ordered hall/hostel allocation rules (SA.10)                           |
| `/admissions-workflow` | Applicant-facing SA.01 status chain presentation; stage set is S027-owned       |
| `/audit-log`           | Read-only S003 history of every configuration change and release event          |
| `/releases`            | App-store pipeline: WCAG 2.1 AA audit gating and DG step-up approval (CON-G1)   |

Non-negotiables, enforced structurally: no individual student data anywhere in the portal (aggregate
analytics only), every configuration write records to the S003 audit seam, sensitive governance
actions sit behind TOTP step-up, and access is least-privilege via per-screen capability gates on
top of role-gated routing.

## Stack

React 19, TypeScript, Vite, Tailwind v4, `@rfdtech/components` design system, react-router v7,
TanStack Query v5 (declarative endpoint factory), Zustand, react-hook-form + zod, ZITADEL OIDC
(Authorization Code + PKCE). pnpm + Turborepo monorepo: `apps/web` is the portal; `packages/*` hold
the shared `@starter/*` plumbing. See [ARCHITECTURE.md](ARCHITECTURE.md).

## Getting started

Prerequisites: Node `>=22` (`nvm use`) and pnpm `>=11` (`corepack enable`).

```bash
pnpm install

# Configure the app env (ZITADEL client, service URLs, mock switches)
cp apps/web/.env.example apps/web/.env

# Run the portal (http://localhost:5290)
pnpm dev --filter @starter/web
```

Signing in requires a ZITADEL user with the system administrator role; the `VITE_ZITADEL_*` values
in `.env.example` document what the app expects.

### Everyday commands

```bash
pnpm typecheck   # whole workspace (or --filter @starter/web)
pnpm lint
pnpm test        # unit + invariant tests (audit pairing, G-02, release state machine)
pnpm build
```

Husky runs lint-staged on pre-commit and commitlint (Conventional Commits) on commit-msg. See
[CONTRIBUTING.md](CONTRIBUTING.md) for the workflow and allowed scopes.

## Patched dependency

`@rfdtech/components@2.0.1` is patched via pnpm (`patches/@rfdtech__components@2.0.1.patch`) to fix
the Table row-actions menu rendering at the viewport origin instead of by its kebab button. Reported
upstream as
[CLET-GSL-DEV/gsl-components#23](https://github.com/CLET-GSL-DEV/gsl-components/issues/23); on any
library upgrade, re-test the kebab menu and drop or re-apply the patch.

## Documentation map

| Document                                                                       | What it covers                                                              |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| [ARCHITECTURE.md](ARCHITECTURE.md)                                             | Monorepo layout, endpoint factory, theming contract, single vs multi-app    |
| [ADMIN_PORTAL_TRACEABILITY.md](ADMIN_PORTAL_TRACEABILITY.md)                   | SRS responsibility map, SPEC gaps, integration seams, verification evidence |
| [CONTRIBUTING.md](CONTRIBUTING.md)                                             | Branching, commit conventions, where code goes                              |
| [operating-manual-software-delivery.md](operating-manual-software-delivery.md) | The delivery discipline this project is held to                             |
| `C3_S028_Student_App_SRS_v1.0.pdf`                                             | The S028 SRS; sole source of truth for requirements                         |
| `.claude/skills/`                                                              | Agent-facing rules and patterns (mirrored at `.opencode/skills/`)           |
