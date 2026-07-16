import { type Plugin, loadEnv } from 'vite';

import { createAppConfig } from '@starter/vite-config';

/**
 * Substitute the `__ZITADEL_ORIGIN__`, `__API_CSP_ORIGINS__` and
 * `__DEV_CSP_EXTRA__` placeholders in index.html:
 *  - `__ZITADEL_ORIGIN__` -> the ZITADEL authority origin from the env, plus
 *    `VITE_ZITADEL_LOGIN_UI_ORIGIN` when set, so the CSP `connect-src`/
 *    `frame-src` allow the IdP (OIDC discovery, token, refresh, session
 *    iframe) and — for deployments that serve the interactive login UI on a
 *    separate origin from the OIDC/API instance — that origin too. Falls
 *    back to an empty string when both are unset, keeping the CSP valid in
 *    any build mode (e.g. CI).
 *  - `__API_CSP_ORIGINS__` -> the bare origins of `VITE_API_URL` and
 *    `VITE_IAM_URL` when they're absolute URLs (deduped — the services may
 *    share a gateway or live on separate hosts), so `connect-src` allows the
 *    backends when calling them directly (no Vite dev-server proxy / reverse
 *    proxy in front). Relative values are same-origin already and contribute
 *    nothing here.
 *  - `__DEV_CSP_EXTRA__` -> `'unsafe-eval'` in `vite dev` only, empty in a
 *    production build. Some dependency's dev-mode code path (HMR/refresh
 *    machinery, or a library's environment probe) calls `eval`/`Function`;
 *    the strict production CSP (`script-src 'self'`, no eval) is unaffected.
 */
function zitadelCsp(authority: string, apiOrigins: string, mode: string): Plugin {
  return {
    name: 'zitadel-csp-origin',
    transformIndexHtml(html) {
      return html
        .replaceAll('__ZITADEL_ORIGIN__', authority)
        .replaceAll('__API_CSP_ORIGINS__', apiOrigins)
        .replaceAll('__DEV_CSP_EXTRA__', mode === 'production' ? '' : "'unsafe-eval'");
    },
  };
}

/** Deduped bare `scheme://host[:port]` origins of the absolute service URLs. */
function apiConnectOrigins(env: Record<string, string>): string {
  const origins = [env.VITE_API_URL, env.VITE_IAM_URL]
    .map((value) => (value ?? '').trim())
    .filter((value) => /^https?:\/\//.test(value))
    .flatMap((value) => {
      try {
        return [new URL(value).origin];
      } catch {
        // Malformed — env validation (config/env.ts) catches this separately.
        return [];
      }
    });
  return Array.from(new Set(origins)).join(' ');
}

// https://vite.dev/config/
export default createAppConfig({
  root: import.meta.dirname,
  port: 5290,
  extend: ({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const zitadelOrigin = [env.VITE_ZITADEL_AUTHORITY, env.VITE_ZITADEL_LOGIN_UI_ORIGIN]
      .map((value) => (value ?? '').trim())
      .filter(Boolean)
      .join(' ');
    const apiOrigins = apiConnectOrigins(env);
    return {
      plugins: [zitadelCsp(zitadelOrigin, apiOrigins, mode)],
    };
  },
});
