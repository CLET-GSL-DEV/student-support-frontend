import { type UserManagerSettings, WebStorageStateStore } from 'oidc-client-ts';

export interface ZitadelEnv {
  authority: string;
  clientId: string;
  redirectUri: string;
  postLogoutRedirectUri: string;
  /**
   * Optional ZITADEL project id. When set, `buildAuthConfig` requests the
   * `urn:zitadel:iam:org:project:id:<projectId>:aud` scope so the project is
   * added to the token audience. The project-roles claim that `hasRole` reads
   * is requested regardless (via `urn:zitadel:iam:org:projects:roles`).
   */
  projectId?: string;
}

/**
 * Strip the OIDC response params from the URL after the code exchange. We do NOT
 * perform a `window.location` hard navigation here (that would wipe the
 * in-memory token store); the post-login redirect is handled softly by
 * `AuthCallback` via React Router so the session survives.
 */
function onSigninCallback(): void {
  window.history.replaceState({}, document.title, window.location.pathname);
}

export type GslAuthConfig = Partial<UserManagerSettings> & {
  authority: string;
  client_id: string;
  redirect_uri: string;
  onSigninCallback: () => void;
};

/**
 * Build the ZITADEL / oidc-client-ts configuration passed to `<AuthProvider>`.
 *
 * Tokens are held in `sessionStorage` so the session survives a page reload or a
 * restored tab without waiting on silent renew, and is still cleared when the tab
 * closes. This trades the in-memory store's XSS resistance for that persistence —
 * a script injected via XSS can read the stored tokens. To go back to the
 * XSS-resistant in-memory store, swap `userStore` for
 * `new WebStorageStateStore({ store: new InMemoryWebStorage() })`.
 *
 * This is a PKCE public client: it carries NO client secret.
 */
export function buildAuthConfig(env: ZitadelEnv): GslAuthConfig {
  // `urn:zitadel:iam:org:projects:roles` makes ZITADEL emit the per-project
  // `urn:zitadel:iam:org:project:<id>:roles` claim that `hasRole` reads. The
  // per-project `:aud` scope is only added when a project id is supplied.
  const scopes = [
    'openid',
    'profile',
    'email',
    'offline_access',
    'urn:zitadel:iam:org:projects:roles',
  ];
  if (env.projectId) {
    scopes.push(`urn:zitadel:iam:org:project:id:${env.projectId}:aud`);
  }

  return {
    authority: env.authority,
    client_id: env.clientId,
    redirect_uri: env.redirectUri,
    post_logout_redirect_uri: env.postLogoutRedirectUri,
    scope: scopes.join(' '),
    response_type: 'code',
    // ZITADEL v2's login UI (the authorization endpoint used by any iframe-based
    // renewal) sends `X-Frame-Options: deny`, so it can never be framed. That rules
    // out both `monitorSession`'s check_session iframe and a `prompt=none` silent
    // renew iframe. `monitorSession` is off; renewal instead relies entirely on
    // `automaticSilentRenew` + the `offline_access` scope above, which makes
    // oidc-client-ts renew via a direct refresh_token POST to the token endpoint
    // (no iframe) as long as ZITADEL issued a refresh token for this client.
    monitorSession: false,
    automaticSilentRenew: true,
    userStore: new WebStorageStateStore({ store: window.sessionStorage }),
    onSigninCallback,
  };
}
