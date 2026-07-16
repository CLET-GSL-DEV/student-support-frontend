import { type ReactNode, useState } from 'react';

import { AccessRestrictedDialog } from './AccessRestrictedDialog';
import { useAuth } from './useAuth';

interface AccessGateProps {
  /** Access is granted when the user has ANY of these ZITADEL project roles —
   * the same `hasRole` check `ProtectedRoute` uses for route guarding, so a
   * component-level gate never disagrees with the route it's nested inside. */
  requiredRoles: string | string[];
  children: ReactNode;
  fallback?: ReactNode | null;
  /** True for an in-place action (e.g. a gated button) rather than a whole page. */
  isAction?: boolean;
  /** Where the restricted dialog's "Return to Dashboard" navigates. */
  homePath?: string;
}

/**
 * In-page role gate for content narrower than a route (a section, a button, a
 * modal action). For whole-route guarding, use `ProtectedRoute` from
 * `@starter/auth` instead — both read the same `hasRole`, so they can't disagree.
 */
export function AccessGate({
  requiredRoles,
  children,
  fallback = null,
  isAction = false,
  homePath = '/',
}: AccessGateProps) {
  const { hasRole } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(true);

  const required = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  const granted = required.some((role) => hasRole(role));

  if (granted) {
    return <>{children}</>;
  }

  return (
    <>
      {fallback}
      <AccessRestrictedDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        isAction={isAction}
        homePath={homePath}
      />
    </>
  );
}
