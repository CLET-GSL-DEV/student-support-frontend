/**
 * Runtime configuration, read from `window.__CONFIG__`.
 *
 * The app used to have its IdP authority, client id and project id compiled in by Vite,
 * so an image built for one domain could not run on another and promoting a build meant
 * rebuilding it — the artifact that was tested was never the artifact that shipped.
 *
 * `config.js` is written by the container entrypoint (docker/docker-entrypoint.sh) and
 * loaded from index.html as a CLASSIC script before the app's module bundle, which is
 * deferred — so `window.__CONFIG__` exists by the time any module runs.
 *
 * This returns the SAME `VITE_*` keys the app already reads, so `config/env.ts` keeps its
 * zod schema and a container given missing or malformed config fails exactly as a bad
 * build used to. With no container there is no config.js, and the Vite env stays the
 * source, so `pnpm dev` and the tests are unchanged.
 *
 * The key names and shape below are deliberately identical to what
 * ghcr.io/clet-gsl-dev/clet-frontend-base's entrypoint emits, so adopting that base image
 * later needs no app change. See the Dockerfile for why it cannot be adopted today.
 */
export interface RuntimeConfig {
  domain: string;
  zitadelAuthority: string;
  apiBaseUrl: string;
  zitadelClientId: string;
  zitadelProjectId: string;
  zitadelAudienceProjectIds: string;
  appEnv: string;
  sentryDsn: string;
}

declare global {
  interface Window {
    __CONFIG__?: Partial<RuntimeConfig>;
  }
}

function config(): Partial<RuntimeConfig> | undefined {
  return typeof window === 'undefined' ? undefined : window.__CONFIG__;
}

/**
 * The platform domain this container was started with, or '' in dev. Derive sibling URLs
 * from it rather than hardcoding one environment's hostname.
 */
export function runtimeDomain(): string {
  return config()?.domain ?? '';
}

/**
 * The OIDC redirect URIs are NOT part of `window.__CONFIG__`.
 *
 * This app owns its own `/auth/callback` and `/auth/logout/callback` on its own origin,
 * so the correct value is always the origin the browser actually loaded — never a value
 * a build or a ConfigMap has to restate, and never one that can drift from the host the
 * user is on. Deriving them also keeps the config object byte-compatible with
 * clet-frontend-base, which emits no such keys.
 */
function originUrl(path: string): string | undefined {
  return typeof window === 'undefined' ? undefined : `${window.location.origin}${path}`;
}

const DERIVED_PATHS: ReadonlyArray<readonly [key: string, path: string]> = [
  ['VITE_ZITADEL_REDIRECT_URI', '/auth/callback'],
  ['VITE_ZITADEL_POST_LOGOUT_URI', '/auth/logout/callback'],
];

function isBlank(value: unknown): boolean {
  return typeof value !== 'string' || value.trim() === '';
}

/**
 * Merge `window.__CONFIG__` over a fallback (pass `import.meta.env`). Only keys actually
 * present override it — a partially populated config must not blank out a value the
 * fallback supplies.
 */
export function runtimeEnv(
  fallback: Record<string, unknown> = {},
): Record<string, string | undefined> {
  const c = config();
  const merged: Record<string, unknown> = { ...fallback };

  if (c) {
    const mapped: Record<string, unknown> = {
      VITE_API_URL: c.apiBaseUrl,
      VITE_APP_ENV: c.appEnv,
      VITE_SENTRY_DSN: c.sentryDsn,
      VITE_ZITADEL_AUTHORITY: c.zitadelAuthority,
      VITE_ZITADEL_CLIENT_ID: c.zitadelClientId,
      VITE_ZITADEL_PROJECT_ID: c.zitadelProjectId,
      // Not in this app's schema yet; carried so the shape stays whole and adding it
      // later is a schema change alone.
      VITE_ZITADEL_AUDIENCE_PROJECT_IDS: c.zitadelAudienceProjectIds,
    };
    for (const [k, v] of Object.entries(mapped)) {
      if (v !== undefined && v !== '') merged[k] = v;
    }
  }

  for (const [key, path] of DERIVED_PATHS) {
    if (!isBlank(merged[key])) continue;
    const derived = originUrl(path);
    if (derived !== undefined) merged[key] = derived;
  }

  return merged as Record<string, string | undefined>;
}
