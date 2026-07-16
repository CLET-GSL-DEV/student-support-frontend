/**
 * App-store release governance shapes (SRS §1.2, §2.2, CON-G1, CON-L1).
 * Every release needs a WCAG 2.1 AA audit by an independent assessor before
 * submission; statutory-impacting releases additionally require CLET DG
 * step-up MFA approval. S028 is co-owned: the admin surfaces and initiates,
 * the DG approves, DTI delivers.
 * // SPEC: the release workflow detail is not defined in the SRS; this state
 * machine is a placeholder with the governance gates made explicit.
 */

export const RELEASE_STATUSES = {
  DRAFT: 'draft',
  WCAG_AUDIT: 'wcag-audit',
  AWAITING_APPROVAL: 'awaiting-approval',
  APPROVED: 'approved',
  SUBMITTED: 'submitted',
  RELEASED: 'released',
  REJECTED: 'rejected',
} as const;
export type ReleaseStatus = (typeof RELEASE_STATUSES)[keyof typeof RELEASE_STATUSES];

export const RELEASE_STATUS_LABELS: Record<ReleaseStatus, string> = {
  [RELEASE_STATUSES.DRAFT]: 'Draft',
  [RELEASE_STATUSES.WCAG_AUDIT]: 'In WCAG audit',
  [RELEASE_STATUSES.AWAITING_APPROVAL]: 'Awaiting DG approval',
  [RELEASE_STATUSES.APPROVED]: 'Approved',
  [RELEASE_STATUSES.SUBMITTED]: 'Submitted to stores',
  [RELEASE_STATUSES.RELEASED]: 'Released',
  [RELEASE_STATUSES.REJECTED]: 'Rejected',
};

export const PLATFORMS = ['ios', 'android'] as const;
export type Platform = (typeof PLATFORMS)[number];

export const PLATFORM_LABELS: Record<Platform, string> = {
  ios: 'App Store',
  android: 'Google Play',
};

export type WcagAuditStatus = 'pending' | 'passed' | 'failed';

export interface WcagAudit {
  status: WcagAuditStatus;
  /** Independent assessor (CON-L1: the audit must be independent). */
  auditor?: string;
  /** Reference to the audit report artefact. */
  reportRef?: string;
  completedAt?: string;
}

export interface AppRelease {
  id: string;
  version: string;
  summary: string;
  platforms: Platform[];
  /** Statutory-impacting releases (accessibility, welfare, fees) require
   * CLET DG step-up MFA approval (CON-G1). */
  statutoryImpacting: boolean;
  status: ReleaseStatus;
  wcagAudit: WcagAudit;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReleaseInput {
  version: string;
  summary: string;
  platforms: Platform[];
  statutoryImpacting: boolean;
}

export interface AuditResultInput {
  passed: boolean;
  auditor: string;
  reportRef: string;
}
