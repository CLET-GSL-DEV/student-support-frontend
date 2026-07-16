import { z } from 'zod';

import { createEnv } from '@starter/api-client';

// Each backend service gets its own full base URL (service path included,
// version segment excluded — config/api.ts appends `/v1`). A value may be:
//  - a /-relative path (e.g. `/api/app`) -> same-origin; in dev the Vite
//    proxy forwards `/api/*` to VITE_DEV_API_PROXY_TARGET, in production the
//    app is served same-origin behind the gateway; or
//  - an absolute URL (e.g. `https://gateway.uat.rfdgh.com/api/hrm`) to call
//    a gateway directly — it must send CORS headers for browser calls, and
//    its origin is added to the CSP connect-src (see vite.config.ts).
const serviceBaseUrl = (defaultPath: string) =>
  z
    .string()
    .default(defaultPath)
    // Unset OR blank means "use the default" — the old VITE_API_ORIGIN
    // convention was "leave it empty for dev", so a migrated .env may
    // legitimately carry an empty assignment.
    .transform((v) => v.trim() || defaultPath)
    .pipe(
      z
        .string()
        // The relative branch rejects a leading `//` — a protocol-relative
        // URL is cross-origin (axios resolves it against the page scheme),
        // not a same-origin path, and would bypass the CSP/proxy wiring.
        .refine((v) => /^\/(?!\/)[^\s]*$/.test(v) || /^https?:\/\/\S+$/.test(v), {
          message: 'must be a /-relative path (e.g. /api/app) or an absolute http(s) URL',
        })
        .transform((v) => v.replace(/\/+$/, '')),
    );

const envSchema = z.object({
  // App/Student Support service base URL — the default for every module's endpoints.
  VITE_API_URL: serviceBaseUrl('/api/app'),
  // IAM service base URL — `/me` session check, admin users/roles, invitations.
  VITE_IAM_URL: serviceBaseUrl('/api/iam'),
  VITE_APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  VITE_SENTRY_DSN: z.string().default(''),
  // Toggles the IAM `/me` session check: the on-login fetch AND the recurring
  // session poller. "false" makes zero `/me` calls — the session user is
  // derived from the ZITADEL token instead (see useSessionPoller).
  VITE_SESSION_CHECK_ENABLED: z.enum(['true', 'false']).default('true'),
  // ZITADEL OIDC (Authorization Code + PKCE, public client — NO secret). This
  // app owns its own /login + /auth/callback (no central login app).
  VITE_ZITADEL_AUTHORITY: z.string().url(),
  VITE_ZITADEL_CLIENT_ID: z.string().default(''),
  VITE_ZITADEL_REDIRECT_URI: z.string().url(),
  VITE_ZITADEL_POST_LOGOUT_URI: z.string().url(),
  // Optional ZITADEL project id. When set, the project is added to the token
  // audience; the project-roles claim `hasRole` reads is requested regardless.
  VITE_ZITADEL_PROJECT_ID: z.string().default(''),
  // Frontend-only delivery switches for the Admin Portal data layer. Every
  // backend path sits behind a repository interface; 'mock' serves dummy data,
  // 'api' routes through the gateway client stubs (see src/data/dataSource.ts).
  VITE_ADMIN_DATA_SOURCE: z.enum(['mock', 'api']).default('mock'),
  // Initial mock scenario for every mock repository: 'populated' seeds dummy
  // data, 'empty' returns empty collections, 'error' makes calls fail, so
  // loading/empty/error states are exercisable without a backend.
  VITE_ADMIN_MOCK_SCENARIO: z.enum(['populated', 'empty', 'error']).default('populated'),
});

const parsed = createEnv(envSchema, import.meta.env);

export const env = {
  apiUrl: parsed.VITE_API_URL,
  iamUrl: parsed.VITE_IAM_URL,
  appEnv: parsed.VITE_APP_ENV,
  sentryDsn: parsed.VITE_SENTRY_DSN,
  sessionCheckEnabled: parsed.VITE_SESSION_CHECK_ENABLED === 'true',
  zitadel: {
    authority: parsed.VITE_ZITADEL_AUTHORITY,
    clientId: parsed.VITE_ZITADEL_CLIENT_ID,
    redirectUri: parsed.VITE_ZITADEL_REDIRECT_URI,
    postLogoutRedirectUri: parsed.VITE_ZITADEL_POST_LOGOUT_URI,
    projectId: parsed.VITE_ZITADEL_PROJECT_ID,
  },
  adminDataSource: parsed.VITE_ADMIN_DATA_SOURCE,
  adminMockScenario: parsed.VITE_ADMIN_MOCK_SCENARIO,
} as const;
