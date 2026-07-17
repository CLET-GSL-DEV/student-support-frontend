import { SectionDescription, SectionHeader, SectionTitle } from '@rfdtech/components';

import { CapabilityGate } from '@/components/capability-gate';
import { CAPABILITIES } from '@/constants/admin';

import { WorkflowStages } from '../components';

/**
 * SA.01 admissions status workflow configuration (SRS §2.3, B-01, §2.4).
 * The applicant chain (Application Received through Enrolled, plus the
 * rejection branch with appeal rights) drives what applicants see in the
 * student app; each transition triggers an SA.08 notification. Every edit
 * records to the S003 audit seam.
 */
export function Component() {
  return (
    <CapabilityGate capability={CAPABILITIES.ADMISSIONS_WORKFLOW_READ}>
      <div className="flex flex-col gap-6">
        <SectionHeader>
          <SectionTitle>Admissions Workflow</SectionTitle>
          <SectionDescription>
            The status chain applicants see in SA.01. Stage order and transitions are owned by the
            S027 admissions pipeline; the applicant-facing wording and notification triggers are
            configured here.
          </SectionDescription>
        </SectionHeader>
        <WorkflowStages />
      </div>
    </CapabilityGate>
  );
}
