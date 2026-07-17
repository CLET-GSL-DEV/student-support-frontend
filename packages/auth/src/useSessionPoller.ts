import { useEffect, useRef } from 'react';

import type { AxiosInstance } from 'axios';

import { ApiError, createService } from '@starter/api-client';

import { ROLES, normalizeRoles } from './roles';
import { type IamMeResponse, mapIamMeResponse, meEndpoint } from './session-api';
import { type SessionUser, useSessionStore } from './sessionStore';
import { useAuth } from './useAuth';

/** The GSL Student Support project-role slugs, sourced from the authoritative ZITADEL token
 * (via `hasRole`) rather than IAM `/me`, which only carries IAM platform
 * roles. Deduped so aliases mapping to the same slug don't repeat. */
const GSL_ROLE_SLUGS = Array.from(new Set(Object.values(ROLES)));

export interface UseSessionPollerOptions {
  /** The IAM axios client (from `createIamClient`, pointed at the IAM
   * backend `/api/iam/v1`). Passing the app's Student Support client here is a 404. */
  client: AxiosInstance;
  /** Poll interval in ms — matches the old single-app poller's cadence. */
  intervalMs?: number;
  /** Override how the IAM `/me` response becomes the shared session user. Keep
   * this a stable (module-level) function — it's an effect dependency. */
  mapProfile?: (raw: IamMeResponse) => SessionUser;
  /** When false, no `/me` call is ever made — neither the on-login check nor
   * the recurring poll. The session user is built from the ZITADEL token
   * (roles via `hasRole`, name/email from OIDC claims) so the header and
   * role UI keep working without IAM. Defaults to true. */
  enabled?: boolean;
}

function usersEqual(a: SessionUser | null, b: SessionUser): boolean {
  if (!a) return false;
  return (
    a.id === b.id &&
    a.email === b.email &&
    a.displayName === b.displayName &&
    a.institutionId === b.institutionId &&
    JSON.stringify(a.roles) === JSON.stringify(b.roles)
  );
}

/** Only a rejected identity ends the session. A 404, a 500 or a dropped
 * connection means the check didn't run, not that the account is gone. */
function isRevoked(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

/**
 * Background session/profile poller — the app-level freshness check that sits
 * on top of ZITADEL's own silent renew. ZITADEL keeps the *access token*
 * valid; this catches things the token doesn't know about yet, like the
 * backend revoking the account or changing roles server-side.
 *
 * Polls IAM's `GET /v1/me` every `intervalMs` while authenticated; refreshes
 * the shared session user on change, and flips `sessionExpired`
 * (→ `SessionExpiredDialog`) when the identity is rejected.
 */
export function useSessionPoller({
  client,
  intervalMs = 60_000,
  mapProfile = mapIamMeResponse,
  enabled = true,
}: UseSessionPollerOptions) {
  const { isAuthenticated, user: oidcUser, hasRole } = useAuth();
  const setUser = useSessionStore((s) => s.setUser);
  const expireSession = useSessionStore((s) => s.expireSession);

  // Read via a ref so a silent token renew (new `hasRole` identity) doesn't
  // restart the polling interval, matching the `oidcProfile` pattern below.
  const hasRoleRef = useRef(hasRole);
  useEffect(() => {
    hasRoleRef.current = hasRole;
  }, [hasRole]);

  // iam-3.0's /v1/me carries no display name, so the header name comes from
  // the ZITADEL token's own profile claims (the OIDC `name` / `preferred_username`
  // claims from the in-memory token). Read via a ref so a silent token renew
  // doesn't restart the polling interval.
  const oidcProfile = useRef(oidcUser?.profile);
  useEffect(() => {
    oidcProfile.current = oidcUser?.profile;
  }, [oidcUser]);

  useEffect(() => {
    if (!isAuthenticated) return;

    if (!enabled) {
      // `/me` checks are toggled off (see VITE_SESSION_CHECK_ENABLED): no
      // on-login check, no polling. Populate the session user straight from
      // the ZITADEL token so HeaderProfile/role UI still render.
      const claims = oidcProfile.current;
      const tokenRoleSlugs = GSL_ROLE_SLUGS.filter((slug) => hasRoleRef.current(slug));
      const nextUser: SessionUser = {
        id: claims?.sub ?? '',
        email: claims?.email ?? '',
        displayName: claims?.name ?? claims?.preferred_username ?? claims?.email ?? '',
        roles: normalizeRoles(tokenRoleSlugs),
        institutionId: null,
        institutionCode: '',
      };
      if (!usersEqual(useSessionStore.getState().user, nextUser)) {
        setUser(nextUser);
      }
      return;
    }

    const fetchProfile = createService(meEndpoint, client);
    let active = true;

    const poll = async () => {
      if (useSessionStore.getState().sessionExpired) return;

      try {
        const data = await fetchProfile();
        let nextUser = mapProfile(data);
        // IAM `/me` only carries IAM platform roles (e.g. `iam_admin`), which
        // `normalizeRoles` strips — leaving the role switcher empty. The real
        // GSL Student Support project roles live in the ZITADEL token, so source them from
        // `hasRole` (the same authoritative check `ProtectedRoute` uses).
        const tokenRoleSlugs = GSL_ROLE_SLUGS.filter((slug) => hasRoleRef.current(slug));
        if (tokenRoleSlugs.length > 0) {
          nextUser = { ...nextUser, roles: normalizeRoles(tokenRoleSlugs) };
        }
        if (!nextUser.displayName) {
          const claims = oidcProfile.current;
          nextUser = {
            ...nextUser,
            displayName: claims?.name ?? claims?.preferred_username ?? nextUser.email,
          };
        }
        const currentUser = useSessionStore.getState().user;
        if (!usersEqual(currentUser, nextUser)) {
          setUser(nextUser);
        }
      } catch (error) {
        if (active && isRevoked(error)) expireSession();
      }
    };

    void poll();
    const id = setInterval(() => void poll(), intervalMs);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [isAuthenticated, enabled, client, intervalMs, mapProfile, setUser, expireSession]);
}
