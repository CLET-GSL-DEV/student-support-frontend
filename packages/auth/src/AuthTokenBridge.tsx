import { useEffect } from 'react';

import { authStore } from '@starter/api-client';

import { useSessionStore } from './sessionStore';
import { useAuth } from './useAuth';

/**
 * Headless bridge between the React auth context and the framework-agnostic
 * `authStore` that `createApiClient` reads. Mirrors the current OIDC access
 * token into the store, and wires the silent-renew / re-login handlers the API
 * client invokes on a 401.
 */

/**
 * Read the access token directly from `sessionStorage` where `oidc-client-ts`
 * writes the user synchronously via `WebStorageStateStore`. The key follows the
 * oidc-client-ts convention: `oidc.user:{authority}:{client_id}`.
 *
 * This bypasses React entirely so the token is always fresh even when React's
 * context update hasn't re-rendered `AuthTokenBridge` yet (the root cause of
 * stale tokens being sent on API calls right after a silent renew).
 */
function readTokenFromSessionStorage(authority: string, clientId: string): string | null {
  try {
    const key = `oidc.user:${authority}:${clientId}`;
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && 'access_token' in parsed) {
      return (parsed as { access_token: string }).access_token;
    }
    return null;
  } catch {
    return null;
  }
}

export function AuthTokenBridge() {
  const auth = useAuth();

  // Point authStore's token source at oidc-client-ts's sessionStorage so every
  // API call reads the freshest token regardless of React's render batching —
  // oidc-client-ts writes to sessionStorage synchronously BEFORE firing the
  // userLoaded event that triggers React state. We inject a *reader*
  // (`setTokenReader`) rather than reassigning `authStore.getToken`, because
  // every portal's api client captured `authStore.getToken` by reference at
  // module load; reassigning the property would leave those captures stale and
  // send requests with no Authorization header.
  useEffect(() => {
    const { authority, client_id: clientId } = auth.settings;

    authStore.setTokenReader(() => readTokenFromSessionStorage(authority, clientId));

    authStore.setRefreshHandler(async () => {
      const user = await auth.signinSilent();
      return user?.access_token ?? null;
    });
    // Renewal genuinely failed (e.g. no/expired refresh token) — surface the
    // same session-expired modal the `/me` poller already uses (`useSessionPoller`)
    // instead of silently re-sending the stale token or forcing a hard redirect.
    // Runs outside React (axios interceptor), hence the imperative `getState()`.
    authStore.setAuthErrorHandler(() => {
      useSessionStore.getState().expireSession();
    });
    return () => {
      authStore.setTokenReader(null);
      authStore.setRefreshHandler(null);
      authStore.setAuthErrorHandler(null);
    };
  }, [auth]);

  return null;
}
