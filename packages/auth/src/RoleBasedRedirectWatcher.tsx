import { useRoleBasedRedirect } from './hooks/useRoleBasedRedirect';

interface RoleBasedRedirectWatcherProps {
  /** Set false for a self-contained app outside the multi-portal split. */
  enabled?: boolean;
}

/**
 * Mounts `useRoleBasedRedirect` for the lifetime of the app, via
 * `AppProviders` — not just at `/auth/callback`. ZITADEL's silent token
 * renewal (`automaticSilentRenew`) picks up updated role claims and
 * re-renders every `useAuth()` consumer, including this one, so a role
 * reassigned mid-session — not just a fresh sign-in — sends the user to the
 * right portal as soon as their token reflects it. Renders nothing.
 */
export function RoleBasedRedirectWatcher({ enabled = true }: RoleBasedRedirectWatcherProps) {
  useRoleBasedRedirect(enabled);
  return null;
}
