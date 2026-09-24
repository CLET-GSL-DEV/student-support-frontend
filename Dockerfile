# Build the Student Support SPA and serve the static bundle from the org frontend base image.
#
# Stage 2 stays two lines: unprivileged nginx on 8080, security headers, gzip, per-path caching, /healthz
# and the /api proxy all come from the base (see CLET-GSL-DEV/clet-frontend-base).
FROM node:22-alpine AS builder
WORKDIR /app

# pnpm comes from the "packageManager" field via corepack, so the image can never build with a
# different pnpm than the lockfile was written by.
RUN corepack enable

COPY . .

# No VITE_* build args. Domain, IdP authority and client ids arrive at container start
# (window.__CONFIG__), so this image is the same artifact in every environment.
#
# --frozen-lockfile: fail loudly on a lockfile that disagrees with the manifests rather than silently
# resolving something other than what CI tested.
RUN pnpm install --frozen-lockfile

# turbo builds the app's workspace dependencies first, then the app.
ARG APP=web
RUN pnpm exec turbo run build --filter=@starter/${APP}

FROM ghcr.io/clet-gsl-dev/clet-frontend-base:dev AS runner
ARG APP=web
# --chown=101:101 is required: the container runs as uid 101 and its entrypoint writes config.js and
# patches index.html at start.
COPY --chown=101:101 --from=builder /app/apps/${APP}/dist /usr/share/nginx/html
