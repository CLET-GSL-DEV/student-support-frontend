import { ADMIN_AREAS } from '@/constants/admin';
import { withAudit } from '@/data/audit';
import { guardMockWrite, nowIso, resolveScenario } from '@/data/support';
import type { AdmissionsWorkflowStage, StagePresentationInput } from '@/types/admissionsWorkflow';

import type { AdmissionsWorkflowRepository } from './repository';

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * The B-01 applicant chain (Application Received, Under Review, Decision
 * Pending, Offer Made, Offer Accepted, Enrolled) plus the rejection branch,
 * mapped to the §2.4 staff status keys.
 * // SPEC: B-01's requirement table ends the chain at "Admitted" while its
 * requirements bullet and §4.1 both say "Enrolled"; Enrolled is used here.
 */
const SEED_STAGES: AdmissionsWorkflowStage[] = [
  {
    id: 'stage-received',
    staffStatusKey: 'APPLICATION_RECEIVED',
    applicantLabel: 'Application received',
    applicantDescription: 'Your application has been received and is awaiting review.',
    order: 1,
    notifyOnEnter: true,
    terminal: false,
    rejectionBranch: false,
    showsAppealRights: false,
    updatedAt: daysAgo(45),
  },
  {
    id: 'stage-under-review',
    staffStatusKey: 'UNDER_REVIEW',
    applicantLabel: 'Under review',
    applicantDescription: 'Admissions staff are reviewing your application.',
    order: 2,
    notifyOnEnter: true,
    terminal: false,
    rejectionBranch: false,
    showsAppealRights: false,
    updatedAt: daysAgo(45),
  },
  {
    id: 'stage-decision-pending',
    staffStatusKey: 'DECISION_PENDING',
    applicantLabel: 'Decision pending',
    applicantDescription: 'A decision on your application is being finalised.',
    order: 3,
    notifyOnEnter: true,
    terminal: false,
    rejectionBranch: false,
    showsAppealRights: false,
    updatedAt: daysAgo(45),
  },
  {
    id: 'stage-offer-made',
    staffStatusKey: 'DECISION_MADE',
    applicantLabel: 'Offer made',
    applicantDescription: 'An offer has been made. Review it and respond with your decision.',
    order: 4,
    notifyOnEnter: true,
    terminal: false,
    rejectionBranch: false,
    showsAppealRights: false,
    updatedAt: daysAgo(45),
  },
  {
    id: 'stage-offer-accepted',
    staffStatusKey: 'OFFER_ACCEPTED',
    applicantLabel: 'Offer accepted',
    applicantDescription: 'You have accepted your offer. Enrolment is being finalised.',
    order: 5,
    notifyOnEnter: true,
    terminal: false,
    rejectionBranch: false,
    showsAppealRights: false,
    updatedAt: daysAgo(45),
  },
  {
    id: 'stage-enrolled',
    staffStatusKey: 'ENROLLED',
    applicantLabel: 'Enrolled',
    applicantDescription: 'You are enrolled. The full student app suite is now available to you.',
    order: 6,
    notifyOnEnter: true,
    terminal: true,
    rejectionBranch: false,
    showsAppealRights: false,
    updatedAt: daysAgo(45),
  },
  {
    id: 'stage-rejected',
    staffStatusKey: 'DECISION_MADE',
    applicantLabel: 'Application unsuccessful',
    applicantDescription:
      'Your application was not successful this time. The decision and your appeal rights are shown with it.',
    order: 7,
    notifyOnEnter: true,
    terminal: true,
    rejectionBranch: true,
    showsAppealRights: true,
    updatedAt: daysAgo(45),
  },
];

export class MockAdmissionsWorkflowRepository implements AdmissionsWorkflowRepository {
  private stages: AdmissionsWorkflowStage[] = [...SEED_STAGES];

  async list(): Promise<AdmissionsWorkflowStage[]> {
    const stages = await resolveScenario(this.stages, []);
    return [...stages].sort((a, b) => a.order - b.order);
  }

  async updateStage(id: string, input: StagePresentationInput): Promise<AdmissionsWorkflowStage> {
    await guardMockWrite();
    const existing = this.stages.find((stage) => stage.id === id);
    if (!existing) throw new Error('Workflow stage not found.');
    const updated: AdmissionsWorkflowStage = { ...existing, ...input, updatedAt: nowIso() };
    return withAudit(
      {
        area: ADMIN_AREAS.ADMISSIONS_WORKFLOW,
        action: 'stage.updated',
        summary: `Updated the "${updated.applicantLabel}" admissions stage presentation`,
        reference: id,
      },
      async () => {
        this.stages = this.stages.map((stage) => (stage.id === id ? updated : stage));
        return updated;
      },
    );
  }
}
