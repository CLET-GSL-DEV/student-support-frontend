import { create } from 'zustand';

import type { ParsedRole } from './roles';

/**
 * Display/freshness profile for the signed-in user — mirrors the Student Support backend
 * `/me` response, not ZITADEL's token claims. Purely informational (e.g. a
 * name/role badge in the header); it does NOT drive authorization. Route and
 * component guarding both read `useAuth().hasRole()` (ZITADEL) instead, so
 * there's exactly one source of truth for access decisions.
 */
export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  roles: ParsedRole[];
  /** IAM-assigned institution for this account (institution officers). Null
   * until IAM populates the assignment, or for roles with no institution. */
  institutionId: string | null;
  institutionCode: string;
}

interface SessionState {
  user: SessionUser | null;
  activeRole: string | null;
  sessionExpired: boolean;
  sessionExpiredMessage: string | null;
  setUser: (user: SessionUser | null) => void;
  setActiveRole: (role: string) => void;
  expireSession: (message?: string) => void;
  clearSession: () => void;
}

const DEFAULT_EXPIRED_MESSAGE =
  'Your session has expired due to inactivity. Please login again to continue.';

/**
 * Deliberately NOT persisted: the ZITADEL access token already lives only in
 * memory (`authStore` in `@starter/api-client`), so on reload the app silently
 * re-authenticates and refetches `/me` — there's nothing worth surviving a
 * reload here, and persisting would just show stale data before that refetch.
 */
export const useSessionStore = create<SessionState>()((set) => ({
  user: null,
  activeRole: null,
  sessionExpired: false,
  sessionExpiredMessage: null,
  setUser: (user) => set({ user, activeRole: user?.roles.at(0)?.role ?? null }),
  setActiveRole: (role) => set({ activeRole: role }),
  expireSession: (message) =>
    set({ sessionExpired: true, sessionExpiredMessage: message ?? DEFAULT_EXPIRED_MESSAGE }),
  clearSession: () =>
    set({ user: null, activeRole: null, sessionExpired: false, sessionExpiredMessage: null }),
}));
