import { Navigate } from 'react-router';

import { ErrorPage } from './ErrorPage';
import { GLOBAL_ROUTES } from './GLOBAL_ROUTES';
import { useRoleBasedRedirect } from './hooks/useRoleBasedRedirect';
import { CenteredMessage } from './statuses';
import { useAuth } from './useAuth';

/** sessionStorage key the login page sets before redirecting to the IdP. */
export const RETURN_TO_KEY = 'return_to';

interface AuthCallbackProps {
  /** Fallback destination when no `return_to` was stored. */
  to?: string;
  /** Set true for a self-contained app outside the multi-portal split —
   * skips the cross-portal hard redirect and always routes in-app. */
  skipRoleRedirect?: boolean;
}

/**
 * Rendered at the OIDC `redirect_uri`. The mounted AuthProvider performs the
 * code exchange automatically; once authenticated, `useRoleBasedRedirect`
 * sends the user to the portal their role belongs to if this isn't it —
 * otherwise we route into the app with a SOFT React Router navigation (a
 * hard reload would wipe the in-memory session). We honor a `return_to` path
 * stashed by the login page before sign-in.
 */
export function AuthCallback({ to = '/', skipRoleRedirect = false }: AuthCallbackProps) {
  const auth = useAuth();
  const redirectingToPortal = useRoleBasedRedirect(!skipRoleRedirect);

  if (auth.error)
    return <ErrorPage title="Authentication error" description={auth.error.message} />;

  if (auth.isAuthenticated) {
    if (redirectingToPortal) return <CenteredMessage>Taking you to your portal…</CenteredMessage>;

    const returnTo = sessionStorage.getItem(RETURN_TO_KEY);
    if (returnTo) sessionStorage.removeItem(RETURN_TO_KEY);
    return <Navigate to={returnTo ?? to} replace />;
  }

  return <CenteredMessage>Completing sign-in…</CenteredMessage>;
}

export function LogoutCallback() {
  return <Navigate to={GLOBAL_ROUTES.LOGIN} replace />;
}
