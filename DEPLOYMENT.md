# Deploying to Vercel

`apps/web` is a **static, client-only Vite SPA** (no server/serverless code). It talks to external
services directly: the RFD gateways, ZITADEL (OIDC), and Supabase. So the Vercel deploy is a pure
static build + CDN.

[`vercel.json`](./vercel.json) (repo root) already encodes the monorepo build, the SPA fallback, and
security headers. You mostly just set env vars.

## 1. Create the Vercel project

- Import `CLET-GSL-DEV/student-support-frontend`.
- **Root Directory:** leave it as the repo root (default). `vercel.json` points the build at the
  workspace and outputs `apps/web/dist`.
- Framework / build / install / output are all read from `vercel.json`:
  - install: `pnpm install --frozen-lockfile`
  - build: `pnpm --filter @starter/web build` (runs `tsc --noEmit && vite build`)
  - output: `apps/web/dist`
- Node ≥ 22 and pnpm 11 are picked up from `engines` / `packageManager`.
- Recommended: set `RFDUI_SKIP_SETUP=1` (a plain build env var, not `VITE_`) so
  `@rfdtech/components`' postinstall skips wiring local AI-tooling during the CI build. It's
  harmless either way (it self-guards and never fails install), but skipping keeps the build clean.

> Alternative: set **Root Directory = `apps/web`** in the dashboard and let Vercel auto-detect Vite.
> If you do that, move `vercel.json` into `apps/web/` and drop the
> `buildCommand`/`installCommand`/`outputDirectory` overrides (Vercel installs from the workspace
> root automatically).

## 2. Environment variables (set BEFORE the first deploy)

Every `VITE_*` var is **inlined at build time** — they are baked into the bundle during
`vite build`, not read at runtime. Changing one requires a **redeploy**. Set these in Vercel →
Project → Settings → Environment Variables (Production, and Preview if you use preview deploys).
Missing the required ZITADEL vars makes the app white-screen on load (runtime env validation
throws).

### Required

| Variable                       | Value / note                                                                                                                                                                                                            |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_ZITADEL_AUTHORITY`       | Bare origin of your ZITADEL instance, e.g. `https://auth.uat.rfdgh.com`. Added to the CSP automatically.                                                                                                                |
| `VITE_ZITADEL_CLIENT_ID`       | The ZITADEL application (PKCE public) client id.                                                                                                                                                                        |
| `VITE_ZITADEL_REDIRECT_URI`    | `https://<your-vercel-domain>/auth/callback`                                                                                                                                                                            |
| `VITE_ZITADEL_POST_LOGOUT_URI` | `https://<your-vercel-domain>/auth/logout/callback`                                                                                                                                                                     |
| `VITE_ZITADEL_PROJECT_ID`      | ZITADEL project id (scopes the token audience + roles claim).                                                                                                                                                           |
| `VITE_API_URL`                 | **Must be an absolute gateway URL in prod** (e.g. `https://gateway.uat.rfdgh.com/api/hrm`). The default `/api/app` is same-origin and there is NO backend on Vercel. Its origin is auto-added to the CSP `connect-src`. |
| `VITE_IAM_URL`                 | Absolute IAM gateway URL (e.g. `https://api.uat.rfdgh.com/api/iam`). Also auto-added to the CSP.                                                                                                                        |
| `VITE_APP_ENV`                 | `production`                                                                                                                                                                                                            |

### Data layer (Supabase) — required if `VITE_ADMIN_DATA_SOURCE=supabase`

| Variable                  | Value / note                                                                   |
| ------------------------- | ------------------------------------------------------------------------------ |
| `VITE_ADMIN_DATA_SOURCE`  | `mock` \| `api` \| `supabase`                                                  |
| `VITE_SUPABASE_URL`       | e.g. `https://uespikqmsjwenkbokyjh.supabase.co`. Origin auto-added to the CSP. |
| `VITE_SUPABASE_ANON_KEY`  | Public anon key (safe in the client). **Never** the service-role key.          |
| `VITE_EMAIL_FUNCTION_URL` | Optional. The `send-email` Edge Function URL if the app sends mail.            |

### Optional

| Variable                       | Value / note                                                                            |
| ------------------------------ | --------------------------------------------------------------------------------------- |
| `VITE_SESSION_CHECK_ENABLED`   | `true` (default) or `false` (derive the session user from token claims, no `/me` call). |
| `VITE_SENTRY_DSN`              | Sentry DSN, or leave unset.                                                             |
| `VITE_ZITADEL_LOGIN_UI_ORIGIN` | Only if ZITADEL's login UI is on a separate origin.                                     |
| `VITE_ADMIN_MOCK_SCENARIO`     | `populated` \| `empty` \| `error` (only affects `mock`).                                |

## 3. Register the deployed URLs in ZITADEL

OIDC will reject the login unless the app's redirect URIs are registered on the ZITADEL application.
Add, for your Vercel domain (and any preview domains you use):

- Redirect: `https://<domain>/auth/callback`
- Post-logout: `https://<domain>/auth/logout/callback`

Keep `VITE_ZITADEL_REDIRECT_URI` / `VITE_ZITADEL_POST_LOGOUT_URI` in step 2 in sync with what you
register here.

## 4. CSP is baked at build time

The `connect-src` / `frame-src` origins in the CSP `<meta>` tag are substituted during `vite build`
from `VITE_ZITADEL_AUTHORITY`, `VITE_API_URL`, `VITE_IAM_URL`, and `VITE_SUPABASE_URL` (see
`apps/web/vite.config.ts`). If you change any of those origins, **redeploy** so the CSP updates. The
static security headers (`X-Frame-Options`, `frame-ancestors`, HSTS, etc.) come from `vercel.json`.
The `apps/web/public/_headers` file is for Netlify/Cloudflare only — Vercel ignores it.

## 5. Before production (open items)

- **Lock down Supabase RLS.** The migration ships a testing-permissive policy (anon can read+write
  every table). See `supabase/README.md` before going live.
- **Rotate the Resend key** if it was ever shared in plaintext, and gate the `send-email` function
  behind ZITADEL verification.

## Verify the build locally

```bash
pnpm --filter @starter/web build   # tsc --noEmit && vite build -> apps/web/dist
pnpm --filter @starter/web preview # serve the built output
```
