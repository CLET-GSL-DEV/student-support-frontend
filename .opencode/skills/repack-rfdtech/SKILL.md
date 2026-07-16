---
name: repack-rfdtech
description: |
  Rebuild and reinstall @rfdtech/components from local source
  (~/mm/gsl-components) into this repo's vendor, wipe node_modules,
  and reinstall. Only needed if you switch off the default npm install
  to develop against unreleased component-library changes.
---

# Repack @rfdtech/components from Local Source

## When to use

This starter installs `@rfdtech/components` from public npm by default (see `pnpm-workspace.yaml` —
no vendor override is configured). Use this skill only if you're developing the component library
itself and need to consume unreleased local changes here instead of a published npm version: after
making changes in `~/mm/gsl-components` (the component library source), this rebuilds the library,
packs a fresh `.tgz`, copies it into `vendor/`, wipes `node_modules`, and does a clean
`pnpm install`.

## Prerequisites

- `~/mm/gsl-components` has the latest source (uncommitted changes OK)
- `pnpm` is the package manager (no bun/npm/yarn)

## One-time setup: add the vendor override

Add a `pnpm.overrides` (or top-level `overrides`, depending on pnpm version) entry to the root
`package.json` pointing `@rfdtech/components` at the vendored tarball, and create `vendor/` at the
repo root. Skip this if you're not using local-source development — the default npm install needs no
override.

## Workflow

```bash
# 1. Stop any running dev servers first
pkill -f "turbo run dev" || true
# or find the specific port: lsof -i :5290

# 2. Build + pack the component library
cd ~/mm/gsl-components
npm run build
npm pack

# 3. Copy fresh tgz to this repo's vendor
cp ~/mm/gsl-components/rfdtech-components-2.0.0.tgz \
   ~/development/Websites/student-support-frontend/vendor/rfdtech-components-2.0.0.tgz

# 4. Wipe + reinstall
cd ~/development/Websites/student-support-frontend
rm -rf node_modules
pnpm install

# 5. Verify it's linked
pnpm ls @rfdtech/components --depth=0 --filter @starter/web
pnpm typecheck --filter @starter/web
```

## One-liner (full cycle)

```bash
cd ~/mm/gsl-components && npm run build && npm pack && \
  cp rfdtech-components-2.0.0.tgz ~/development/Websites/student-support-frontend/vendor/ && \
  cd ~/development/Websites/student-support-frontend && rm -rf node_modules && pnpm install
```

## Notes

- Once the override is wired, `pnpm-workspace.yaml` should carry it as e.g.
  `'@rfdtech/components': file:./vendor/rfdtech-components-2.0.0.tgz` — don't touch that block once
  set up, it's load-bearing for local-source dev.
- After reinstall, `@rfdtech/components` postinstall hooks will re-wire MCP config files (.mcp.json,
  skills, etc.) — that's expected.
