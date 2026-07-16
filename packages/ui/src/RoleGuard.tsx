import type { ReactNode } from 'react';
import { Navigate } from 'react-router';

import { GLOBAL_ROUTES, type ROLES, useAuth } from '@starter/auth';

interface RoleGuardProps {
  roles: ROLES[];
  children: ReactNode;
  /** Where to send a user missing every required role. Defaults to the
   * shared `GLOBAL_ROUTES.FORBIDDEN` path every portal mounts. */
  forbiddenTo?: string;
}

/**
 * Restricts a route to specific roles, reading `hasRole` (ZITADEL) — the same
 * check `ProtectedRoute`/`AccessGate` use, so a route guard and an in-page
 * gate can never disagree. A nav config's `roles` filter only hides the
 * sidebar link — it doesn't stop direct navigation. This does.
 */
export function RoleGuard({
  roles,
  children,
  forbiddenTo = GLOBAL_ROUTES.FORBIDDEN,
}: RoleGuardProps) {
  const { hasRole } = useAuth();
  const allowed = roles.some((r) => hasRole(r));

  if (!allowed) {
    return <Navigate to={forbiddenTo} replace />;
  }

  return <>{children}</>;
}
