import { ROLES } from '@starter/auth';

/**
 * This app's roles, in priority order. `router.tsx`'s `ProtectedRoute` gates
 * entry on this exact list. This platform is single-role: only system admins
 * sign in (`ROLES.SYSTEM_ADMIN` -> the `system_administration` ZITADEL
 * project-role key, verified against a live token; the legacy
 * `admin`/`system_admin`/`system_administrator` spellings normalize to the
 * same slug via `ROLE_ALIASES`).
 */
export const PREFERRED_ROLES: readonly ROLES[] = [ROLES.SYSTEM_ADMIN];
