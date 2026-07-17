/**
 * SA.01 admissions status workflow shapes (SRS B-01, §2.4). The stage set
 * and transitions are owned by the S027 NLEMS pipeline (the §2.4 status
 * matrix allows no manual state changes); this portal configures the
 * applicant-facing presentation: labels, descriptions, and whether entering
 * a stage triggers an SA.08 notification (B-01 requires one per transition).
 * // SPEC: whether the admin may add or remove stages is not defined in the
 * SRS; stages are locked to the S027 set pending the Admin Portal
 * requirements document.
 */
export interface AdmissionsWorkflowStage {
  id: string;
  /** Internal CLET staff status key from the §2.4 status matrix. Read-only
   * here; owned by S027. */
  staffStatusKey: string;
  /** What the applicant sees in SA.01 (B-01). */
  applicantLabel: string;
  /** Interpretation shown alongside the status in SA.01. */
  applicantDescription: string;
  /** 1-based position in the linear applicant chain. */
  order: number;
  /** Entering this stage triggers an SA.08 notification (B-01). */
  notifyOnEnter: boolean;
  /** Terminal stages end status tracking (Enrolled, or the rejection branch). */
  terminal: boolean;
  /** True only for the rejection branch off Decision Pending; B-01 requires
   * the decision to display alongside appeal rights. */
  rejectionBranch: boolean;
  /** Appeal rights are displayed with the decision (B-01). */
  showsAppealRights: boolean;
  updatedAt: string;
}

/** What the admin may edit; everything else is S027-owned. */
export interface StagePresentationInput {
  applicantLabel: string;
  applicantDescription: string;
  notifyOnEnter: boolean;
}
