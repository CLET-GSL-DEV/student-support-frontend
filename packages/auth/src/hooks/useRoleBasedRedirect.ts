import { useEffect } from 'react';

import { PORTALS } from '../portals';
import { ROLES } from '../roles';
import { useAuth } from '../useAuth';

/**
 * Once the signed-in user's ZITADEL role is known, sends them to the portal
 * that role belongs to — unless they're already there. Portals are separate
 * deployed apps on separate origins, so a cross-portal move is a hard
 * redirect (`window.location.replace`), not an in-app navigation.
 *
 * Call this from `AuthCallback` right after sign-in completes, so a user
 * always lands on their own portal regardless of which app's `/login` they
 * started the sign-in flow from. Returns `true` while a cross-origin
 * redirect is underway, so the caller can hold off on its own in-app
 * navigation instead of flashing it right before the hard redirect fires.
 * Returns `false` when the user is already on one of their portals, or has
 * no recognized role — the portal's own `ProtectedRoute` handles the latter
 * via its `forbiddenTo` screen.
 *
 * Pass `enabled: false` for a self-contained app that isn't part of the
 * multi-portal split (e.g. a standalone test harness) — it then never
 * hard-redirects away to another portal's origin.
 */
export function useRoleBasedRedirect(enabled = true): boolean {
  const auth = useAuth();

  const myRoles = auth.isAuthenticated
    ? (Object.values(ROLES) as ROLES[]).filter((role) => auth.hasRole(role))
    : [];
  const firstRole = myRoles[0];
  const target = firstRole ? PORTALS[firstRole].url : undefined;
  const shouldRedirect =
    enabled &&
    target != null &&
    !myRoles.some((role) => PORTALS[role].url === window.location.origin);

  useEffect(() => {
    if (shouldRedirect && target) window.location.replace(target);
  }, [shouldRedirect, target]);

  return shouldRedirect;
}
