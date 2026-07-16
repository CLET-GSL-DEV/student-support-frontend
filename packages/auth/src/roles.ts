/**
 * EVS role identity.
 *
 * Access control is role-membership only (`hasRole` / `AccessGate`) — there is
 * deliberately no module-access bitmask here. The single-app codebase had a
 * frontend-only `ROLE_ACCESS` bitmask (READ/WRITE/DELETE per module) that
 * duplicated real authorization decisions the backend already makes; it added
 * complexity without adding security, so it isn't carried into the monorepo.
 */

/**
 * IAM/EVS platform roles the application recognises.
 *
 * These slugs are the EXACT ZITADEL project-role keys — `useAuth().hasRole()`
 * does a raw `hasOwnProperty` lookup on the token's project-roles claim (no
 * alias resolution), so a canonical value that doesn't match the token key
 * would silently never match. Keep these in lock-step with the roles ZITADEL
 * actually emits; map any alternate spelling from other sources through
 * `ROLE_ALIASES` instead of adding it here.
 */
export const ROLES = {
  // The live ZITADEL project emits `system_administration` (verified against
  // an actual token's project-roles claim) — NOT `system_administrator`,
  // which survives only as an alias for older IAM records.
  ADMIN: 'system_administration',
  SYSTEM_ADMIN: 'system_administration',
  INSTITUTION_OFFICER: 'institution_officer',
  AUDITOR: 'auditor',
  REGISTRAR: 'registrar',
  VERIFIER: 'verification_officer',
  INTERNAL_ASSESSOR: 'internal_assessor',
  GTEC_ASSESSOR: 'gtec_assessor',
  CANDIDATE: 'candidate',
  DIRECTOR_GENERAL: 'director_general',
} as const;
export type ROLES = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_TYPE = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
} as const;
export type ROLE_TYPE = (typeof ROLE_TYPE)[keyof typeof ROLE_TYPE];

export interface ParsedRole {
  role: ROLES;
  type: ROLE_TYPE;
}

/**
 * Alternate role spellings seen from IAM / the EVS backend seeds, mapped to
 * the canonical `ROLES` slug.
 */
const ROLE_ALIASES: Record<string, string> = {
  // `admin` is `system_administration` in all but name — it has no portal or
  // identity of its own.
  admin: 'system_administration',
  // Legacy slugs the app used before aligning to the ZITADEL project-role
  // keys; still accepted from the IAM `/me` profile or older records.
  system_admin: 'system_administration',
  system_administrator: 'system_administration',
  verifier: 'verification_officer',
  // Backward-compat: an already-provisioned IAM account may still carry the
  // old typo'd role string ('registar') on file — normalize it to the
  // canonical, correctly-spelled 'registrar' slug.
  registar: 'registrar',
  assessor: 'internal_assessor',
  auditor_general: 'auditor',
};

/**
 * The authoritative set of role codes this system grants access to — every
 * auth check validates against this, nothing else. A role string that isn't in
 * here (directly or via an alias whose target IS in here) is treated as no role
 * at all, never trusted through on its face.
 */
const ACCESSIBLE_ROLE_CODES = new Set<string>(Object.values(ROLES));

/**
 * Type guard: `true` only when `code` is a role the system actually grants
 * access to. Use this to narrow an untrusted string to a `ROLES` before acting
 * on it, so a bad/unknown role can never flow into a portal or guard decision.
 */
export function isKnownRole(code: string | null | undefined): code is ROLES {
  return code != null && ACCESSIBLE_ROLE_CODES.has(code);
}

/**
 * Resolve a raw IAM/backend role spelling to a canonical, *accessible* `ROLES`
 * code — or `undefined` when it maps to no accessible role. We never pass an
 * unrecognised string through on trust: the result is cross-checked against
 * `ACCESSIBLE_ROLE_CODES`, and so is any alias target, so neither an unknown
 * role nor a mistyped alias entry can leak a non-accessible role downstream.
 */
export function resolveRoleCode(roleCode: string): ROLES | undefined {
  if (isKnownRole(roleCode)) return roleCode;
  const aliased = ROLE_ALIASES[roleCode];
  return isKnownRole(aliased) ? aliased : undefined;
}

/**
 * All raw claim keys that satisfy a given canonical role — the role itself
 * plus every `ROLE_ALIASES` spelling that resolves to it. `hasRole` does a
 * raw key lookup on the ZITADEL project-roles claim, so a gate declared with
 * a canonical `ROLES` value must also accept the raw keys ZITADEL actually
 * emits — e.g. the seeded token key `assessor` satisfies an
 * `internal_assessor` gate. Use this everywhere a required role is checked
 * against `hasRole` (ProtectedRoute, useRoleBasedRedirect).
 */
export function expandRoleAliases(role: string): string[] {
  const keys = [role];
  for (const [raw, canonical] of Object.entries(ROLE_ALIASES)) {
    if (canonical === role) keys.push(raw);
  }
  return keys;
}

/**
 * Resolve which of a signed-in user's roles is "the" role for a given portal.
 *
 * Each portal declares its own `preferredRoles` — an ordered priority list of
 * the roles it owns (e.g. accessor-portal prefers Internal Assessor over GTEC
 * Assessor). This checks that list first, in order, and returns the first
 * entry the user actually holds. Only when none of the preferred roles match
 * does it fall back to checking the rest of the user's roles, in their own
 * order — so a role the portal didn't explicitly rank still resolves to
 * *something* rather than nothing, but never overrides a preferred match.
 *
 * Callers pass already-validated `ROLES` (e.g. from `normalizeRoles` or a
 * `hasRole` scan) — this does no accessibility check of its own, it only
 * orders roles the caller has already established are real.
 */
export function resolvePreferredRole(
  preferredRoles: readonly ROLES[],
  userRoles: readonly ROLES[],
): ROLES | undefined {
  const held = new Set(userRoles);
  return preferredRoles.find((role) => held.has(role)) ?? userRoles[0];
}

/**
 * Format a role code into a human-readable label.
 * "system_administration" → "System Administration"
 */
export function formatRoleLabel(role: string): string {
  return role.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Filter raw IAM platform roles down to the ones the system actually grants
 * access to, then pick max 2: first found to primary, second to secondary. IAM
 * may return extra roles (e.g. "default-roles-clet-internal", "offline_access")
 * that are irrelevant to EVS — and `resolveRoleCode` cross-checks every entry
 * (and its alias target) against the accessible-roles set, so nothing unknown
 * survives to become a primary/secondary role.
 */
export function normalizeRoles(platformRoles: string[]): ParsedRole[] {
  const matched = platformRoles.map(resolveRoleCode).filter(isKnownRole);
  const deduped = [...new Set(matched)];
  const roles: ParsedRole[] = [];
  const primary = deduped.at(0);
  const secondary = deduped.at(1);
  if (primary) roles.push({ role: primary, type: ROLE_TYPE.PRIMARY });
  if (secondary) roles.push({ role: secondary, type: ROLE_TYPE.SECONDARY });
  return roles;
}
