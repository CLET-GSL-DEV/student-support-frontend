# syntax=docker/dockerfile:1
#
# Single-app image for the GSL Student Support frontend: builds apps/web
# (@starter/web, React + Vite) from the pnpm/turbo workspace and serves the
# static bundle with nginx. Mirrors the clet-website / leat-frontend pattern.

# ── Stage 1: base (pin pnpm via corepack from package.json packageManager) ─────
FROM node:22-alpine AS base
RUN corepack enable

# ── Stage 2: prune the workspace to just the web app + its deps ────────────────
FROM base AS pruner
WORKDIR /app
COPY . .
RUN pnpm dlx turbo@2 prune @starter/web --docker

# ── Stage 3: install pruned deps and build ─────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
# pnpm-workspace.yaml declares patchedDependencies (@rfdtech/components); turbo
# prune does not reliably copy the patches/ dir, and --frozen-lockfile needs it
# at install time. Bring it over from the unpruned source so the patch applies.
COPY --from=pruner /app/patches ./patches
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .

# No VITE_* build args. Domain, IdP authority and client ids are read at container start
# from window.__CONFIG__, so this image is the same artifact in every environment. The
# Zitadel app remains the SASA Admin Portal (project 382065717291253783); its ids now
# arrive from the ConfigMap rather than being compiled in.
RUN pnpm --filter=@starter/web run build
# Outputs static files to /app/apps/web/dist

# ── Stage 4: serve with nginx ──────────────────────────────────────────────────
FROM ghcr.io/clet-gsl-dev/clet-frontend-base:dev AS runner
# nginx/prod.conf scoped this to its /api/ location; the base applies it at server level,
# which reaches the same requests. Without it uploads 413 at nginx's 1m default.
ENV CLIENT_MAX_BODY_SIZE=50m
COPY --chown=101:101 --from=builder /app/apps/web/dist /usr/share/nginx/html
