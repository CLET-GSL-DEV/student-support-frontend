import type { RouteObject } from 'react-router';

import {
  AuthCallback,
  ForbiddenPage,
  GLOBAL_ROUTES,
  LoginScreen,
  LogoutCallback,
} from '@starter/auth';

export interface GlobalAuthRoutesConfig {
  /** Where LoginScreen and AuthCallback send the user after a successful sign-in. */
  returnTo: string;
  /** Branding shown on the login screen (e.g. "Verifier Portal"). */
  tagline?: string;
  /** Where ForbiddenPage's "Go to Dashboard" link points. */
  dashboardPath: string;
  /** Set true for a self-contained app outside the multi-portal split —
   * the OIDC callback then never hard-redirects to another portal's origin. */
  skipRoleRedirect?: boolean;
}

/**
 * The four auth-flow routes every app mounts at the same `GLOBAL_ROUTES`
 * paths — login, OIDC callback, logout callback, and the post-`ProtectedRoute`
 * forbidden screen. Spread into each app's `createBrowserRouter` array
 * instead of hand-registering each one.
 */
export function GlobalAuthRoutes({
  returnTo,
  tagline,
  dashboardPath,
  skipRoleRedirect,
}: GlobalAuthRoutesConfig): RouteObject[] {
  return [
    { path: GLOBAL_ROUTES.LOGIN, element: <LoginScreen tagline={tagline} returnTo={returnTo} /> },
    {
      path: GLOBAL_ROUTES.AUTH_CALLBACK,
      element: <AuthCallback to={returnTo} skipRoleRedirect={skipRoleRedirect} />,
    },
    { path: GLOBAL_ROUTES.AUTH_LOGOUT_CALLBACK, element: <LogoutCallback /> },
    {
      path: GLOBAL_ROUTES.FORBIDDEN,
      element: <ForbiddenPage dashboardPath={dashboardPath} loginPath={GLOBAL_ROUTES.LOGIN} />,
    },
  ];
}
