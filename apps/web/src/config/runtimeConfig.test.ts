import { afterEach, describe, expect, it } from 'vitest';

import { runtimeDomain, runtimeEnv } from './runtimeConfig';

// jsdom's default origin. The redirect URIs are derived from it rather than configured,
// so the test asserts against the same source the app reads.
const ORIGIN = window.location.origin;

afterEach(() => {
  delete window.__CONFIG__;
});

describe('runtimeEnv', () => {
  it('keeps the fallback when there is no container config', () => {
    const merged = runtimeEnv({ VITE_ZITADEL_AUTHORITY: 'http://localhost:8080' });

    expect(merged.VITE_ZITADEL_AUTHORITY).toBe('http://localhost:8080');
  });

  it('lets the container config override the build-time fallback', () => {
    window.__CONFIG__ = {
      domain: 'nita.gov.gh',
      zitadelAuthority: 'https://auth.nita.gov.gh',
      zitadelClientId: '123',
      zitadelProjectId: '456',
      apiBaseUrl: 'https://gateway.nita.gov.gh/api/app',
      appEnv: 'staging',
    };

    const merged = runtimeEnv({
      VITE_ZITADEL_AUTHORITY: 'http://localhost:8080',
      VITE_APP_ENV: 'development',
    });

    expect(merged.VITE_ZITADEL_AUTHORITY).toBe('https://auth.nita.gov.gh');
    expect(merged.VITE_ZITADEL_CLIENT_ID).toBe('123');
    expect(merged.VITE_ZITADEL_PROJECT_ID).toBe('456');
    expect(merged.VITE_API_URL).toBe('https://gateway.nita.gov.gh/api/app');
    expect(merged.VITE_APP_ENV).toBe('staging');
  });

  // A ConfigMap that omits a key must not blank out a value the fallback supplies —
  // otherwise a partially populated config is worse than no config at all.
  it('does not let an absent or empty config value blank the fallback', () => {
    window.__CONFIG__ = { domain: 'uat.rfdgh.com', zitadelClientId: '' };

    const merged = runtimeEnv({
      VITE_ZITADEL_AUTHORITY: 'http://localhost:8080',
      VITE_ZITADEL_CLIENT_ID: 'from-build',
    });

    expect(merged.VITE_ZITADEL_AUTHORITY).toBe('http://localhost:8080');
    expect(merged.VITE_ZITADEL_CLIENT_ID).toBe('from-build');
  });

  it('derives the OIDC redirect URIs from the served origin', () => {
    window.__CONFIG__ = { domain: 'uat.rfdgh.com', zitadelClientId: '123' };

    const merged = runtimeEnv({});

    expect(merged.VITE_ZITADEL_REDIRECT_URI).toBe(`${ORIGIN}/auth/callback`);
    expect(merged.VITE_ZITADEL_POST_LOGOUT_URI).toBe(`${ORIGIN}/auth/logout/callback`);
  });

  it('prefers an explicitly configured redirect URI over the derived one', () => {
    const merged = runtimeEnv({
      VITE_ZITADEL_REDIRECT_URI: 'http://localhost:5290/auth/callback',
      VITE_ZITADEL_POST_LOGOUT_URI: 'http://localhost:5290/auth/logout/callback',
    });

    expect(merged.VITE_ZITADEL_REDIRECT_URI).toBe('http://localhost:5290/auth/callback');
    expect(merged.VITE_ZITADEL_POST_LOGOUT_URI).toBe('http://localhost:5290/auth/logout/callback');
  });
});

describe('runtimeDomain', () => {
  it('is empty without a container config', () => {
    expect(runtimeDomain()).toBe('');
  });

  it('is the domain the container was started with', () => {
    window.__CONFIG__ = { domain: 'uat.rfdgh.com' };

    expect(runtimeDomain()).toBe('uat.rfdgh.com');
  });
});
