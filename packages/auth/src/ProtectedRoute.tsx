import { type ReactNode, useEffect, useRef } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';

import { ErrorPage } from './ErrorPage';
import { ForbiddenPage } from './ForbiddenPage';
import { expandRoleAliases } from './roles';
import { CenteredMessage } from './statuses';
import { useAuth } from './useAuth';

interface ProtectedRouteProps {
  /**
   * Require one or more ZITADEL project roles. Pass a single role or a list;
   * access is granted when the user has ANY of them (OR). Users missing them
   * all get a 403.
   */
  roles?: string | readonly string[];
  /**
   * Where to send unauthenticated users. When set, redirect to this in-app
   * route (e.g. a login page with a "Sign in" button). When omitted, kick off
   * the ZITADEL redirect immediately.
   */
  redirectTo?: string;
  children?: ReactNode;
  /** Shown while the session is resolving / a redirect is in flight. */
  fallback?: ReactNode;
  /**
   * Where to send authenticated users missing every required role — e.g. a
   * `path: "/forbidden"` route rendering `@starter/ui`'s `ForbiddenPage`. When
   * omitted, falls back to a plain, unbranded inline 403.
   */
  forbiddenTo?: string;
}

/**
 * Route guard. Use as a layout route (renders <Outlet />) or wrap children.
 * Authenticated users lacking all of the required `roles` get a 403.
 */
export function ProtectedRoute({
  roles,
  redirectTo,
  children,
  fallback,
  forbiddenTo,
}: ProtectedRouteProps) {
  const auth = useAuth();
  const location = useLocation();
  const redirecting = useRef(false);

  const unauthenticated = !auth.isLoading && !auth.isAuthenticated && !auth.error;

  useEffect(() => {
    // Only auto-launch the IdP redirect when there is no in-app login route.
    if (unauthenticated && !redirectTo && !redirecting.current) {
      redirecting.current = true;
      void auth.signinRedirect();
    }
  }, [auth, unauthenticated, redirectTo]);

  if (auth.error)
    return <ErrorPage title="Authentication error" description={auth.error.message} />;

  if (unauthenticated && redirectTo) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  if (auth.isLoading || !auth.isAuthenticated) {
    return <>{fallback ?? <CenteredMessage>Signing you in…</CenteredMessage>}</>;
  }

  const required = roles == null ? [] : Array.isArray(roles) ? roles : [roles];
  // Expand each required role through its aliases so the raw keys ZITADEL
  // actually emits (e.g. `assessor`) satisfy a canonical gate.
  if (
    required.length &&
    !required.some((r) => expandRoleAliases(r).some((key) => auth.hasRole(key)))
  ) {
    return forbiddenTo ? <Navigate to={forbiddenTo} replace /> : <ForbiddenPage />;
  }

  return children ? <>{children}</> : <Outlet />;
}
