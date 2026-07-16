/**
 * Auth-flow route paths shared by every app — `LoginScreen`, `AuthCallback`,
 * `LogoutCallback`, and `ForbiddenPage` (via `ProtectedRoute`'s `forbiddenTo`)
 * are always mounted at these exact paths, so each app spreads this into its
 * own `ROUTES` instead of retyping the strings.
 */
export const GLOBAL_ROUTES = {
  LOGIN: '/login',
  AUTH_CALLBACK: '/auth/callback',
  AUTH_LOGOUT_CALLBACK: '/auth/logout/callback',
  FORBIDDEN: '/forbidden',
} as const;
