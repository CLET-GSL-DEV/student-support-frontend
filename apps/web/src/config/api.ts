import { authStore, createApiClient } from '@starter/api-client';
import { createIamClient } from '@starter/auth';

import { API_VERSION } from '@/constants/api';

import { env } from './env';

/**
 * App-scoped API client. Requests carry the in-memory access token (fed by
 * `@starter/auth`'s token bridge). On a 401 the client asks the auth layer to
 * silently renew (`signinSilent`) via the injected refresh handler, and on
 * unrecoverable failure defers to the injected auth-error handler
 * (`signinRedirect`) — both wired by the bridge, so this module stays free of
 * React/OIDC imports. Mounted app-wide via `<ApiClientProvider client={api}>`
 * (through `@starter/ui`'s `AppProviders`) so `useQueryEndpoint`/
 * `useMutationEndpoint` default to it.
 *
 * `env.apiUrl` is the service's full base URL (relative `/api/app` by
 * default, or an absolute gateway URL like `https://gateway.../api/hrm`);
 * this client appends only the version segment.
 */
export const api = createApiClient({
  baseURL: `${env.apiUrl}/${API_VERSION}`,
  getToken: authStore.getToken,
  onRefresh: authStore.runRefresh,
  onAuthError: authStore.runAuthError,
});

/**
 * Root-level client (no `/v1`) for endpoints outside the versioned API, e.g.
 * health checks. Not mounted via `<ApiClientProvider>` — pass it explicitly
 * as the 4th arg to `useQueryEndpoint`/`useMutationEndpoint` where needed.
 */
export const apiRoot = createApiClient({
  baseURL: env.apiUrl,
  getToken: authStore.getToken,
  onRefresh: authStore.runRefresh,
  onAuthError: authStore.runAuthError,
});

/**
 * IAM API client — points at IAM's own `GET /v1/me` via the gateway.
 * Returns the authenticated user's identity + active platform roles.
 * Shares the same in-memory token as `api` via `authStore`.
 * See `packages/auth/src/session-api.ts` for the response shape.
 */
export const iamApi = createIamClient({
  baseUrl: env.iamUrl,
  apiVersion: API_VERSION,
});
