# Starter — Agent Entry Point

Before editing any `*.ts` or `*.tsx` file, read the relevant skill in order. Skills are the source
of truth for rules, patterns, and project-specific knowledge.

**AGENTS.md and CLAUDE.md must stay in sync.** Different tools read each file, but the content must
be identical. If you edit one, mirror the change in the other in the same session.

## Skills (read these first)

Located in `.claude/skills/` (mirror at `.opencode/skills/`):

1. `project` — repo orientation, pnpm monorepo shape, stack, env, auth, hard rules.
2. `architecture` — endpoint factory, modules, state, routing, HTTP layer — for the `apps/*` +
   `packages/*` monorepo.
3. `ui-patterns` — `@rfdtech/components` patterns + lessons learned.
4. `rfdtech-ui` — search-first workflow for `@rfdtech/components` (MCP tools), types, rules.
5. `image-to-components` — decompose a screenshot/mockup into existing `@rfdtech/components` before
   hand-rolling UI (installed by `@rfdtech/components`'s postinstall).
6. `api-integration` — API failure modes and the 4-layer sync discipline (frontend hook, endpoint
   factory, axios, backend).
7. `swagger-api` — generate endpoint definitions from an OpenAPI spec.
8. `portals` — historical record of the multi-app/multi-role migration this starter's auth/ui
   packages were carried forward from (role model, dual-role portal pattern, migration methodology
   for splitting a single app into several). Read before planning any future app/package
   restructuring.
9. `repack-rfdtech` — rebuild `@rfdtech/components` from local source, only needed if you switch off
   the default npm install to develop against unreleased component library changes.

See `ARCHITECTURE.md` at the repo root for the full monorepo layout, the endpoint-factory pattern,
the design-system theming contract, and single-app vs multi-app usage guides.

## Operating manual

`operating-manual-software-delivery.md` at the repo root is the operating manual for excellent
software delivery. It governs how work is planned and shipped here: understand the product before
touching a tool, design system before any screen, designed-not-generated UI, contract-first
architecture, standards applied by risk, vertical slices on a walking skeleton, break-it testing
with evidence, security and privacy baked in, and production readiness as a feature. Read it before
planning any feature, milestone, or delivery decision, and hold finished work to its closing
self-test. Its sections are ordered like a real build — do not apply them out of sequence.

For all other rules (no emojis, no inline styles, confidence check, typecheck after edits, git
workflow, env validation) — read the relevant skill. They are not duplicated here on purpose.
