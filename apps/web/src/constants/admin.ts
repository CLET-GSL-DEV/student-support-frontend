import { ROLES } from '@starter/auth';

/**
 * Admin Portal configuration areas, from SRS §2.3: the GSL Student Support
 * Administrator configures notification content, scholarship windows, welfare
 * routing rules, hostel allocation rules, and the SA.01 admissions status
 * workflow. §1.2 adds release governance, §5.1 the S003 audit trail, and
 * §2.3/§2.6 the aggregate-only analytics view.
 */
export const ADMIN_AREAS = {
  NOTIFICATIONS: 'notifications',
  SCHOLARSHIPS: 'scholarships',
  WELFARE_ROUTING: 'welfare-routing',
  HOSTEL_RULES: 'hostel-rules',
  ADMISSIONS_WORKFLOW: 'admissions-workflow',
  ANALYTICS: 'analytics',
  AUDIT: 'audit',
  RELEASES: 'releases',
} as const;
export type AdminArea = (typeof ADMIN_AREAS)[keyof typeof ADMIN_AREAS];

export const ADMIN_AREA_LABELS: Record<AdminArea, string> = {
  [ADMIN_AREAS.NOTIFICATIONS]: 'Notification Content',
  [ADMIN_AREAS.SCHOLARSHIPS]: 'Scholarship Windows',
  [ADMIN_AREAS.WELFARE_ROUTING]: 'Welfare Routing',
  [ADMIN_AREAS.HOSTEL_RULES]: 'Hostel Allocation',
  [ADMIN_AREAS.ADMISSIONS_WORKFLOW]: 'Admissions Workflow',
  [ADMIN_AREAS.ANALYTICS]: 'Analytics',
  [ADMIN_AREAS.AUDIT]: 'Audit Log',
  [ADMIN_AREAS.RELEASES]: 'Release Governance',
};

/**
 * Least-privilege capability model (SRS §2.3: access scope is least-privilege,
 * enforced via S001 IAM). Screens and actions check capabilities, never raw
 * roles, so tightening access later is a mapping change, not a UI change.
 */
export const CAPABILITIES = {
  NOTIFICATIONS_READ: 'notifications:read',
  NOTIFICATIONS_WRITE: 'notifications:write',
  SCHOLARSHIPS_READ: 'scholarships:read',
  SCHOLARSHIPS_WRITE: 'scholarships:write',
  WELFARE_ROUTING_READ: 'welfare-routing:read',
  WELFARE_ROUTING_WRITE: 'welfare-routing:write',
  HOSTEL_RULES_READ: 'hostel-rules:read',
  HOSTEL_RULES_WRITE: 'hostel-rules:write',
  ADMISSIONS_WORKFLOW_READ: 'admissions-workflow:read',
  ADMISSIONS_WORKFLOW_WRITE: 'admissions-workflow:write',
  ANALYTICS_VIEW: 'analytics:view',
  AUDIT_READ: 'audit:read',
  RELEASES_READ: 'releases:read',
  RELEASES_WRITE: 'releases:write',
  // Release approval is a CLET DG action behind step-up MFA (CON-G1); the
  // admin surfaces and initiates, the DG approves.
  RELEASES_APPROVE: 'releases:approve',
} as const;
export type AdminCapability = (typeof CAPABILITIES)[keyof typeof CAPABILITIES];

const ALL_CAPABILITIES: readonly AdminCapability[] = Object.values(CAPABILITIES);

/**
 * Role to capability mapping.
 *
 * // SPEC: the SRS defines the GSL Student Support Administrator's
 * responsibilities (§2.3) but no per-role capability matrix, and this
 * frontend's IAM project currently exposes a single admin role. The system
 * admin therefore holds every capability, including RELEASES_APPROVE, which
 * in production belongs to the CLET DG persona (CON-G1); the approve action
 * is still step-up gated regardless of holder. Replace with the real matrix
 * once the Admin Portal requirements document exists.
 */
export const ROLE_CAPABILITIES: Readonly<Partial<Record<ROLES, readonly AdminCapability[]>>> = {
  [ROLES.SYSTEM_ADMIN]: ALL_CAPABILITIES,
};
