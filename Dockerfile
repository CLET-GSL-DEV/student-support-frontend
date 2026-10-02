# syntax=docker/dockerfile:1
#
# Image for the GSL Student Support Admin Portal (apps/web, @starter/web), built on the
# organisation's shared frontend base (clet-frontend-base, from its template/Dockerfile).
#
# NO VITE_* BUILD ARGS. Domain, IdP authority and the Zitadel client/project ids arrive at
# CONTAINER START, written to /config.js (window.__CONFIG__) by the base's entrypoint, so
# this image is domain-agnostic and promoting a build is not a rebuild. The app reads them
# in apps/web/src/config/runtimeConfig.ts; with no container (pnpm dev) the Vite env is
# the source and nothing changes.
#
# Required at start: PLATFORM_DOMAIN and ZITADEL_CLIENT_ID (plus ZITADEL_PROJECT_ID).
# Leave API_BASE_URL empty: the app calls /api/... on its own host and the base proxies it.
#
# Building this needs read access to the PRIVATE ghcr.io/clet-gsl-dev/clet-frontend-base.
# See the "Building the image" section of DEPLOYMENT.md before wiring it into CI.

# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@11.7.0 --activate
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
ARG APP=web
RUN pnpm --filter=@starter/${APP} run build
# Bundle lands in /app/apps/${APP}/dist. A production build leaves the literal
# __ZITADEL_ORIGIN__ placeholder in dist/index.html's CSP for the base's entrypoint to
# fill; a baked origin would block the runtime authority ("login does nothing").

# ── Stage 2: serve ────────────────────────────────────────────────────────────
FROM ghcr.io/clet-gsl-dev/clet-frontend-base:dev
ARG APP=web
# The previous nginx config allowed 50m request bodies on /api/; the base defaults to 1m.
ENV CLIENT_MAX_BODY_SIZE=50m
# --chown=101:101 is REQUIRED: the container runs as uid 101 and the entrypoint writes
# config.js and patches the CSP in index.html at start.
COPY --chown=101:101 --from=builder /app/apps/${APP}/dist /usr/share/nginx/html
