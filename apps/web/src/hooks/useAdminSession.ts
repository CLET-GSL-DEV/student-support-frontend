import { useCallback, useMemo } from 'react';

import { expandRoleAliases, useAuth, useSessionStore } from '@starter/auth';

import { type AdminCapability, ROLE_CAPABILITIES } from '@/constants/admin';

export interface AdminSession {
  /** Display name for audit attribution and the header; null until the IAM
   * `/me` profile (or token-derived fallback) resolves. */
  displayName: string | null;
  /** Every capability the signed-in administrator holds. */
  capabilities: ReadonlySet<AdminCapability>;
  /** Least-privilege check: gate every screen entry and action on this,
   * never on raw roles (SRS §2.3). */
  can: (capability: AdminCapability) => boolean;
}

/**
 * The AdminSession model: who is signed in and what they may do, derived
 * from the ZITADEL token roles (the single source of truth for access, via
 * `useAuth().hasRole`) mapped through ROLE_CAPABILITIES. Route-level gating
 * stays with ProtectedRoute; this adds the per-area, per-action layer.
 */
export function useAdminSession(): AdminSession {
  const auth = useAuth();
  const user = useSessionStore((state) => state.user);

  const capabilities = useMemo(() => {
    const held = new Set<AdminCapability>();
    for (const [role, roleCapabilities] of Object.entries(ROLE_CAPABILITIES)) {
      const holdsRole = expandRoleAliases(role).some((claimKey) => auth.hasRole(claimKey));
      if (holdsRole) {
        for (const capability of roleCapabilities) held.add(capability);
      }
    }
    return held;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.isAuthenticated, auth.user]);

  const can = useCallback(
    (capability: AdminCapability) => capabilities.has(capability),
    [capabilities],
  );

  return { displayName: user?.displayName ?? null, capabilities, can };
}
