import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { authStore } from '@starter/api-client';

import { AuthTokenBridge } from './AuthTokenBridge';

let mockAuth: Record<string, unknown>;

vi.mock('./useAuth', () => ({ useAuth: () => mockAuth }));

const AUTHORITY = 'https://zitadel.example';
const CLIENT_ID = 'client-123';

/** oidc-client-ts writes the user under this sessionStorage key; the bridge
 * reads the live token from there via `setTokenReader`. */
function seedSessionStorageToken(accessToken: string) {
  window.sessionStorage.setItem(
    `oidc.user:${AUTHORITY}:${CLIENT_ID}`,
    JSON.stringify({ access_token: accessToken }),
  );
}

afterEach(() => {
  cleanup();
  authStore.clear();
  authStore.setTokenReader(null);
  authStore.setRefreshHandler(null);
  authStore.setAuthErrorHandler(null);
  window.sessionStorage.clear();
});

describe('AuthTokenBridge', () => {
  it('reads the live OIDC access token from sessionStorage through authStore', () => {
    seedSessionStorageToken('zitadel-token');
    mockAuth = {
      settings: { authority: AUTHORITY, client_id: CLIENT_ID },
      user: { access_token: 'zitadel-token' },
      signinSilent: vi.fn(),
      signinRedirect: vi.fn(),
    };
    render(<AuthTokenBridge />);
    // The captured `authStore.getToken` reference (as every portal's api client
    // holds) must resolve the token the bridge injected — this is the
    // by-reference regression the token-reader indirection fixes.
    const { getToken } = authStore;
    expect(getToken()).toBe('zitadel-token');
    expect(authStore.isAuthenticated()).toBe(true);
  });

  it('wires a refresh handler that returns the renewed token', async () => {
    const signinSilent = vi.fn().mockResolvedValue({ access_token: 'renewed' });
    mockAuth = {
      settings: { authority: AUTHORITY, client_id: CLIENT_ID },
      user: null,
      signinSilent,
      signinRedirect: vi.fn(),
    };
    render(<AuthTokenBridge />);
    await expect(authStore.runRefresh()).resolves.toBe('renewed');
    expect(signinSilent).toHaveBeenCalledTimes(1);
  });
});
