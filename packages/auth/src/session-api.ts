import { GET } from '@starter/api-client';

import { normalizeRoles } from './roles';
import type { SessionUser } from './sessionStore';

// ── IAM `/v1/me` response types ──────────────────────────────────────────

/**
 * Role entry from IAM's `GET /v1/me` response — structured platform roles.
 */
export interface IamMeRole {
  system_code: string;
  role_id: string;
  is_admin: boolean;
}

/**
 * IAM's `GET /v1/me` payload (after the `createIamClient` response
 * interceptor unwraps the `{ success, message, data }` envelope).
 *
 * Returns the authenticated user's identity + active platform roles.
 * Display name is NOT included — `useSessionPoller` falls back to the
 * OIDC token profile claims (`name` / `preferred_username`) for that.
 */
export interface IamMeResponse {
  id: string;
  email: string;
  phone: string;
  user_type: string;
  status: string;
  metadata: Record<string, unknown> | null;
  roles: IamMeRole[];
}

export const sessionKeys = {
  me: () => ['iam', 'me'] as const,
};

export const meEndpoint = GET<IamMeResponse>({
  path: '/me',
  queryKey: sessionKeys.me(),
});

/**
 * Fold IAM's `/v1/me` response into the shared `SessionUser`.
 *
 * Roles are already structured (`system_code` + `role_id` pairs) so we
 * extract the `role_id` strings and run them through `normalizeRoles` for
 * canonical mapping / alias resolution, keeping consistency with every other
 * role source in the system.
 *
 * `displayName` is **not** available from this endpoint — the caller should
 * fill it from the OIDC token profile (already done in `useSessionPoller`).
 * `institutionId` / `institutionCode` may be resolved from `metadata` in a
 * future iteration; for now they remain null/empty.
 */
export function mapIamMeResponse(raw: IamMeResponse): SessionUser {
  const roleIds = (raw.roles ?? []).map((r) => r.role_id);
  return {
    id: raw.id ?? '',
    email: raw.email ?? '',
    displayName: '',
    roles: normalizeRoles(roleIds),
    institutionId: null,
    institutionCode: '',
  };
}
