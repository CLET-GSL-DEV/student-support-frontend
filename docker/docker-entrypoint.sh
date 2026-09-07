#!/bin/sh
# GSL Student Support frontend (C3 / S028) — container entrypoint.
#
# Writes the runtime configuration, fills the CSP's IdP origin, points /healthz at the
# real entry bundle, renders the nginx config, then execs nginx.
#
# The point of all of it: the image carries no environment-specific string, so the
# artifact that was tested is the one that ships and promoting a build is not a rebuild.
# See clet-kubernetes-platform: docs/concepts/frontend-runtime-config.md.
#
# The variable names and the window.__CONFIG__ shape below are deliberately IDENTICAL to
# ghcr.io/clet-gsl-dev/clet-frontend-base's entrypoint, so the same ConfigMap works either
# way and adopting that base image later is a Dockerfile change with no app change. See
# the Dockerfile header for why this repo cannot adopt it today.
set -eu

: "${PLATFORM_DOMAIN:?PLATFORM_DOMAIN is required — e.g. uat.rfdgh.com. Refusing to start: a portal with no domain cannot reach its IdP, and would fail in a browser rather than here.}"

# Derived from the domain unless overridden, so the common case is one variable.
ZITADEL_AUTHORITY="${ZITADEL_AUTHORITY:-https://auth.${PLATFORM_DOMAIN}}"
API_BASE_URL="${API_BASE_URL:-}"          # empty = same origin, proxied by /api/ below
ZITADEL_CLIENT_ID="${ZITADEL_CLIENT_ID:-}"
ZITADEL_PROJECT_ID="${ZITADEL_PROJECT_ID:-}"
# Comma-separated ZITADEL project ids whose APIs this app also calls. APISIX validates the
# JWT audience per route, so a token addressed only to this app's own project is rejected
# with a 401 on a route owned by another one. Per-environment ids, so not compilable in.
ZITADEL_AUDIENCE_PROJECT_IDS="${ZITADEL_AUDIENCE_PROJECT_IDS:-}"
# One of development | staging | production. The app's zod schema (src/config/env.ts)
# accepts nothing else, and a rejected value throws while the bundle is loading: a blank
# page that answers every probe 200. Checked HERE so a bad ConfigMap stops the container
# instead. If that enum ever gains a value, widen this list with it.
APP_ENV="${APP_ENV:-production}"
case "$APP_ENV" in
  development|staging|production) ;;
  *)
    echo "FATAL: APP_ENV='$APP_ENV' is not one of development, staging, production." >&2
    echo "       The app would reject it while loading and render a blank page that" >&2
    echo "       still answers every probe 200. See apps/web/src/config/env.ts." >&2
    exit 1
    ;;
esac
SENTRY_DSN="${SENTRY_DSN:-}"
export API_UPSTREAM="${API_UPSTREAM:-http://apisix-gateway.infrastructure.svc.cluster.local}"

# nginx does not read /etc/resolv.conf, and a variable proxy_pass needs an explicit
# resolver. Take the container's own first nameserver so this works unchanged in
# Kubernetes, under Docker (127.0.0.11) and on a laptop. IPv6 addresses need brackets in
# an nginx resolver directive.
if [ -z "${DNS_RESOLVER:-}" ]; then
  DNS_RESOLVER="$(awk '/^nameserver/ {print $2; exit}' /etc/resolv.conf 2>/dev/null)"
fi
DNS_RESOLVER="${DNS_RESOLVER:-127.0.0.11}"
case "$DNS_RESOLVER" in *:*) DNS_RESOLVER="[$DNS_RESOLVER]" ;; esac
export DNS_RESOLVER
# nginx's own default is 1m and it silently 413s a larger POST. The previous nginx.conf
# scoped 50m to /api/; this applies it at server level, which reaches the same requests.
export CLIENT_MAX_BODY_SIZE="${CLIENT_MAX_BODY_SIZE:-50m}"

# Replaces the build-time guard that passing VITE_ZITADEL_CLIENT_ID before `vite build`
# used to give. That check stops meaning anything once configuration is runtime, but what
# it protected against does not: a portal serving a page nobody can sign in to looks
# healthy to every probe. AUTH_OPTIONAL is for a portal that genuinely has no login, not
# one missing an id — this one HAS a login, so it must never be set here.
if [ -z "$ZITADEL_CLIENT_ID" ] && [ "${AUTH_OPTIONAL:-false}" != "true" ]; then
  echo "FATAL: ZITADEL_CLIENT_ID is empty and AUTH_OPTIONAL is not 'true'." >&2
  echo "       This portal would serve a page nobody can sign in to, which looks" >&2
  echo "       healthy to every probe. Set the client id, or set AUTH_OPTIONAL=true" >&2
  echo "       if this portal really has no login." >&2
  exit 1
fi

esc() { printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'; }

# config.js is GENERATED, never baked. index.html loads it as a classic script before the
# module bundle, so window.__CONFIG__ exists by the time any app module runs.
#
# The redirect URIs are deliberately NOT here. This app owns its own /auth/callback on its
# own origin, so src/config/runtimeConfig.ts derives them from window.location.origin —
# which keeps this object byte-compatible with clet-frontend-base's, and means a ConfigMap
# written for one works unchanged for the other.
cat > /usr/share/nginx/html/config.js <<EOF
// Generated at container start by docker-entrypoint.sh. Do not edit or bake.
window.__CONFIG__ = {
  domain: "$(esc "$PLATFORM_DOMAIN")",
  zitadelAuthority: "$(esc "$ZITADEL_AUTHORITY")",
  apiBaseUrl: "$(esc "$API_BASE_URL")",
  zitadelClientId: "$(esc "$ZITADEL_CLIENT_ID")",
  zitadelProjectId: "$(esc "$ZITADEL_PROJECT_ID")",
  zitadelAudienceProjectIds: "$(esc "$ZITADEL_AUDIENCE_PROJECT_IDS")",
  appEnv: "$(esc "$APP_ENV")",
  sentryDsn: "$(esc "$SENTRY_DSN")",
};
EOF

# The CSP names the IdP ORIGIN (scheme + host), not the full authority URL. Left baked, a
# runtime authority is blocked by a policy naming the build-time one — and the symptom is
# "login does nothing", with no network error to find.
#
# Rendered from the pristine copy the Dockerfile kept, NOT in place: an in-place sed makes
# the first start consume the placeholder, so `docker restart` (or any restart of the same
# container) with a different authority would silently keep the first one.
ZITADEL_ORIGIN=$(printf '%s' "$ZITADEL_AUTHORITY" | sed -E 's#^(https?://[^/]+).*#\1#')
if [ ! -f /etc/nginx/clet/index.html.template ]; then
  echo "FATAL: /etc/nginx/clet/index.html.template is missing from the image." >&2
  echo "       The Dockerfile must copy dist/index.html there before this runs." >&2
  exit 1
fi
sed "s#__ZITADEL_ORIGIN__#${ZITADEL_ORIGIN}#g" /etc/nginx/clet/index.html.template \
  > /usr/share/nginx/html/index.html

# /healthz serves the REAL entry bundle. A probe on `/` is answered by the SPA fallback
# for ANY path, so an image whose JS never reached dist/ still returns 200 and still
# reports Ready — a portal nobody can use, healthy on every dashboard.
#
# config.js is excluded deliberately: it is written above, at RUNTIME, so it is always
# present and would make this check vacuous. grep -o rather than `sed s///p`, because a
# built index.html can put both script tags on one line and sed substitutes only the
# FIRST match per line.
entry=$(grep -oE '<script[^>]*src="[^"]*\.js"' /usr/share/nginx/html/index.html 2>/dev/null \
        | sed 's/.*src="//; s/"$//' | grep -v '^/config\.js$' | head -n1 || true)

if [ -z "$entry" ]; then
  # Not every SPA emits a <script src>; some inline the entry as a module that import()s
  # the bundle, leaving a modulepreload link as the only reference to a real asset.
  preloads=$(grep -oE '<link[^>]*rel="modulepreload"[^>]*href="[^"]*\.js"' \
             /usr/share/nginx/html/index.html 2>/dev/null \
             | sed 's/.*href="//; s/"$//' | grep -v '^/config\.js$' || true)
  # Prefer the client entry over whatever is preloaded first: the first link is often a
  # vendor chunk — a real file today, but one a later build can split away, and /healthz
  # would then 404 on a perfectly healthy app.
  entry=$(printf '%s\n' "$preloads" | grep -m1 -E '/entry[.-]|/main[.-]|/index[.-]' || true)
  [ -n "$entry" ] || entry=$(printf '%s\n' "$preloads" | head -n1)
fi

if [ -n "$entry" ] && [ -f "/usr/share/nginx/html${entry}" ]; then
  printf 'location = /healthz {\n    access_log off;\n    add_header Cache-Control "no-store" always;\n    try_files %s =404;\n}\n' "$entry" > /etc/nginx/clet/healthz.conf
  echo "healthz -> $entry"
else
  # Fail closed. An image with no entry bundle must not start and report healthy.
  echo "FATAL: no entry bundle found in index.html, or it is missing from the image." >&2
  echo "       Refusing to start rather than serving the SPA fallback to every probe." >&2
  exit 1
fi

# Restricted substitution, NOT a bare `envsubst`: nginx's own $uri / $host / $remote_addr
# / $proxy_host and friends must survive into the rendered config, and a global envsubst
# would blank every one of them.
envsubst '$API_UPSTREAM $CLIENT_MAX_BODY_SIZE $DNS_RESOLVER' \
  < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

echo "runtime config: domain=${PLATFORM_DOMAIN} authority=${ZITADEL_AUTHORITY} apiBaseUrl='${API_BASE_URL}' appEnv=${APP_ENV} port=80 resolver=${DNS_RESOLVER}"
exec nginx -g 'daemon off;'
