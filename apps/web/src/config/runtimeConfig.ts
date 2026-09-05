/**
 * Runtime configuration, read from `window.__CONFIG__`.
 *
 * The app used to have its IdP authority, client ids and sibling-portal URLs
 * compiled in by Vite, so an image built for one domain could not run on another
 * and promoting a build meant rebuilding it — the artifact that was tested was
 * never the artifact that shipped.
 *
 * `config.js` is written by the container entrypoint (clet-frontend-base) and
 * loaded from index.html before the app bundle, so `window.__CONFIG__` exists by
 * the time any module runs.
 *
 * This returns the SAME `VITE_*` keys the app already reads, so the existing
 * defaults keep working and `pnpm dev` / `npm run dev` is unchanged: with no
 * container there is no config.js, and the Vite env stays the source.
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
 * The platform domain this container was started with, or '' in dev.
 * Derive sibling URLs from it instead of hardcoding one environment's hostname.
 */
export function runtimeDomain(): string {
  return config()?.domain ?? '';
}

/** `https://<sub>.<domain>` when a runtime domain is known, otherwise `fallback`. */
export function siblingUrl(sub: string, fallback = ''): string {
  const domain = runtimeDomain();
  return domain ? `https://${sub}.${domain}` : fallback;
}

/**
 * Merge `window.__CONFIG__` over a fallback (pass `import.meta.env`). Only keys
 * actually present override it — a partially populated config must not blank out
 * a value the fallback supplies.
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
      VITE_ZITADEL_AUDIENCE_PROJECT_IDS: c.zitadelAudienceProjectIds,
    };
    for (const [k, v] of Object.entries(mapped)) {
      if (v !== undefined && v !== '') merged[k] = v;
    }
  }
  return merged as Record<string, string | undefined>;
}
