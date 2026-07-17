import type { AdmissionsWorkflowStage, StagePresentationInput } from '@/types/admissionsWorkflow';

/**
 * SA.01 workflow presentation configuration (B-01, §2.4). Stage set is
 * S027-owned and read-only; presentation edits record to the S003 audit
 * seam (§5.1).
 */
export interface AdmissionsWorkflowRepository {
  /** Ordered by `order`, with the rejection branch last. */
  list(): Promise<AdmissionsWorkflowStage[]>;
  updateStage(id: string, input: StagePresentationInput): Promise<AdmissionsWorkflowStage>;
}
