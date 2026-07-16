/**
 * In-memory access-token store. Deliberately NOT persisted to localStorage or
 * sessionStorage — keeping the access token in JS memory only removes it as an
 * XSS exfiltration target.
 *
 * The token itself is produced by the auth layer (e.g. `@starter/auth`, which runs
 * the OIDC/PKCE flow with an in-memory userStore + `offline_access` refresh
 * token). That layer feeds the token in via `setToken` and wires the optional
 * `refreshHandler` / `authErrorHandler` so `createApiClient` can silently renew
 * (`signinSilent`) or trigger re-authentication (`signinRedirect`) on a 401 —
 * all without this framework-agnostic package importing React or oidc-client-ts.
 */
let accessToken: string | null = null;
const listeners = new Set<() => void>();

/** Obtain a fresh access token (e.g. OIDC silent renew); null if unavailable. */
export type RefreshHandler = () => Promise<string | null>;
/** Handle an unrecoverable auth failure (e.g. redirect to the IdP login). */
export type AuthErrorHandler = () => void;
/** Read the live access token from an external source (e.g. oidc-client-ts's
 * sessionStorage). Injected by the auth layer via `setTokenReader`. */
export type TokenReader = () => string | null;

let refreshHandler: RefreshHandler | null = null;
let authErrorHandler: AuthErrorHandler | null = null;
let tokenReader: TokenReader | null = null;

function emit() {
  listeners.forEach((listener) => listener());
}

/** Resolve the current token — prefer the injected reader (always live) and
 * fall back to the in-memory token when no reader is wired. */
function resolveToken(): string | null {
  return tokenReader ? tokenReader() : accessToken;
}

export const authStore = {
  // A STABLE function on purpose: consumers (every portal's `config/api.ts`,
  // `createIamClient`) capture `authStore.getToken` by reference at module
  // load. Delegating to a mutable `tokenReader` means the auth layer can swap
  // the token source (`setTokenReader`) without those captures going stale —
  // reassigning this property instead would leave them pointed at the old fn.
  getToken: (): string | null => resolveToken(),
  setToken: (token: string | null): void => {
    accessToken = token;
    emit();
  },
  /** Inject the live token source. Pass `null` to fall back to the in-memory
   * token. Set by `AuthTokenBridge` to read oidc-client-ts's sessionStorage. */
  setTokenReader: (reader: TokenReader | null): void => {
    tokenReader = reader;
    emit();
  },
  clear: (): void => {
    accessToken = null;
    emit();
  },
  isAuthenticated: (): boolean => resolveToken() !== null,
  /** Subscribe to token changes; returns an unsubscribe fn (for useSyncExternalStore). */
  subscribe: (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  /** Injected by the auth layer; consumed by `createApiClient` on 401. */
  setRefreshHandler: (handler: RefreshHandler | null): void => {
    refreshHandler = handler;
  },
  runRefresh: (): Promise<string | null> =>
    refreshHandler ? refreshHandler() : Promise.resolve(null),
  setAuthErrorHandler: (handler: AuthErrorHandler | null): void => {
    authErrorHandler = handler;
  },
  runAuthError: (): void => {
    authErrorHandler?.();
  },
};
