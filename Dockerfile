# syntax=docker/dockerfile:1
#
# Single-app image for the GSL Student Support frontend: builds apps/web
# (@starter/web, React + Vite) from the pnpm/turbo workspace and serves the
# static bundle with nginx.
#
# NO VITE_* BUILD ARGS. Vite substitutes import.meta.env during the BUILD, so anything
# passed here is compiled into the bundle and an image built for uat.rfdgh.com could only
# ever run there — promoting a build to another environment meant rebuilding it, so the
# artifact that was tested was never the artifact that shipped. Domain, IdP authority,
# client id and project id now arrive at CONTAINER START via docker/docker-entrypoint.sh,
# which writes /usr/share/nginx/html/config.js -> window.__CONFIG__.
# See clet-kubernetes-platform: docs/concepts/frontend-runtime-config.md.
#
# Why this repo does NOT use ghcr.io/clet-gsl-dev/clet-frontend-base
# ------------------------------------------------------------------
# The shared base is the estate default and this image is deliberately built to be
# swappable for it: same entrypoint variables, same window.__CONFIG__ shape. The blocker
# is repository VISIBILITY, not anything in this file.
#
#   This repository is PUBLIC. ghcr.io/clet-gsl-dev/clet-frontend-base is PRIVATE, and a
#   public repo's GITHUB_TOKEN cannot read it — the build fails with `denied` on the
#   manifest HEAD even after the package grant is added. The same visibility split blocks
#   calling CLET-GSL-DEV/.github's reusable build workflow. Both were tried and reverted
#   (PR #35); do not try either again without making this repository private first.
#
# Adopting the base is then a stage-4 swap plus deleting docker/ and nginx/ — the
# ConfigMap keys do not change.

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
RUN pnpm --filter=@starter/web run build
# Outputs static files to /app/apps/web/dist. In a production build vite.config.ts
# deliberately leaves the literal __ZITADEL_ORIGIN__ placeholder in dist/index.html's CSP
# for the entrypoint to fill; a baked origin would block a runtime authority, and the
# symptom is "login does nothing" with nothing in the build to look at.

# ── Stage 4: serve with nginx ──────────────────────────────────────────────────
#
# This is the LAST stage in the file, so `docker build` selects it by default. Do NOT add
# `--target runner` to CI, and do NOT add a stage after it: a later stage would silently
# become the default and CI would start publishing whatever that stage produced.
FROM nginx:alpine AS runner
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY nginx/prod.conf /etc/nginx/templates/default.conf.template
COPY docker/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
# The pristine index.html is kept aside so the entrypoint renders the CSP from it on
# EVERY start. Substituting in place would consume the placeholder on the first start, and
# a container restarted against a different authority would silently keep the first one.
RUN chmod +x /usr/local/bin/docker-entrypoint.sh \
    && mkdir -p /etc/nginx/clet \
    && cp /usr/share/nginx/html/index.html /etc/nginx/clet/index.html.template

# 80, matching this service's Deployment/Service in clet-kubernetes-platform
# (containerPort 80, targetPort 80, probes on port 80). Moving to unprivileged 8080 —
# what clet-frontend-base does — needs that platform change in the same release, or the
# portal never becomes Ready.
EXPOSE 80
# Replaces the nginx image's own entrypoint, so its stock /etc/nginx/templates mechanism
# does not run — this script renders the config itself, with a restricted envsubst.
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
