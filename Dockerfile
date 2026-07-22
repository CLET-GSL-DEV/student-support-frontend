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

# Vite bakes VITE_-prefixed vars into the static bundle at build time.
# API base URLs default to same-origin /api/* (nginx proxies them to the gateway).
# Zitadel points at the CLUSTER instance (auth.uat.rfdgh.com); this app owns its
# OWN /auth/callback, so the redirect URIs use its cluster host and must be
# registered on the Zitadel app in the clet-internal org (project 382952860100329609
# / client 382952860368765065).
ARG VITE_API_URL=/api/app
ARG VITE_IAM_URL=/api/iam
ARG VITE_ZITADEL_AUTHORITY=https://auth.uat.rfdgh.com
ARG VITE_ZITADEL_CLIENT_ID
ARG VITE_ZITADEL_PROJECT_ID
ARG VITE_ZITADEL_REDIRECT_URI
ARG VITE_ZITADEL_POST_LOGOUT_URI
ARG VITE_SESSION_CHECK_ENABLED=true
ARG VITE_ADMIN_DATA_SOURCE=mock
ARG VITE_ADMIN_MOCK_SCENARIO=populated
ARG VITE_APP_ENV=production
ENV VITE_API_URL=$VITE_API_URL \
    VITE_IAM_URL=$VITE_IAM_URL \
    VITE_ZITADEL_AUTHORITY=$VITE_ZITADEL_AUTHORITY \
    VITE_ZITADEL_CLIENT_ID=$VITE_ZITADEL_CLIENT_ID \
    VITE_ZITADEL_PROJECT_ID=$VITE_ZITADEL_PROJECT_ID \
    VITE_ZITADEL_REDIRECT_URI=$VITE_ZITADEL_REDIRECT_URI \
    VITE_ZITADEL_POST_LOGOUT_URI=$VITE_ZITADEL_POST_LOGOUT_URI \
    VITE_SESSION_CHECK_ENABLED=$VITE_SESSION_CHECK_ENABLED \
    VITE_ADMIN_DATA_SOURCE=$VITE_ADMIN_DATA_SOURCE \
    VITE_ADMIN_MOCK_SCENARIO=$VITE_ADMIN_MOCK_SCENARIO \
    VITE_APP_ENV=$VITE_APP_ENV
RUN pnpm --filter=@starter/web run build
# Outputs static files to /app/apps/web/dist

# ── Stage 4: serve with nginx ──────────────────────────────────────────────────
FROM nginx:alpine AS runner
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
# SAME image everywhere; only API_UPSTREAM differs. k8s injects
# API_UPSTREAM=http://apisix-gateway.infrastructure.svc.cluster.local.
COPY nginx/prod.conf /etc/nginx/prod.conf.template
EXPOSE 80
CMD ["/bin/sh","-c","export API_UPSTREAM=${API_UPSTREAM:-http://apisix-gateway.infrastructure.svc.cluster.local}; envsubst '$API_UPSTREAM' < /etc/nginx/prod.conf.template > /etc/nginx/conf.d/default.conf && exec nginx -g 'daemon off;'"]
