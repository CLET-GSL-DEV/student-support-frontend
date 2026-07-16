import { Notice, SectionDescription, SectionHeader, SectionTitle } from '@rfdtech/components';
import { ShieldCheck } from 'lucide-react';

import { CapabilityGate } from '@/components/capability-gate';
import { CAPABILITIES } from '@/constants/admin';

import { ReleasesTable } from '../components';

/**
 * App-store release governance (SRS §1.2, §2.2, CON-G1, CON-L1): mandatory
 * independent WCAG 2.1 AA audits before each release and CLET DG step-up
 * MFA approval for statutory-impacting releases. Co-owned with DTI: the
 * admin surfaces and initiates, the DG approves. Every event records to the
 * S003 audit seam.
 */
export function Component() {
  return (
    <CapabilityGate capability={CAPABILITIES.RELEASES_READ}>
      <div className="flex flex-col gap-6">
        <SectionHeader>
          <SectionTitle>Release Governance</SectionTitle>
          <SectionDescription>
            The App Store and Google Play pipeline for the student app: WCAG audit gating, DG
            approval, and store submission.
          </SectionDescription>
        </SectionHeader>
        <Notice
          variant="info"
          title="Joint governance (CON-G1)"
          icon={<ShieldCheck size={18} strokeWidth={2} aria-hidden />}
          leftBorder
        >
          A release cannot reach the stores without a passed WCAG 2.1 AA audit by an independent
          assessor (CON-L1), and statutory-impacting releases additionally require CLET DG approval
          confirmed with step-up verification. DTI owns technical delivery.
        </Notice>
        <ReleasesTable />
      </div>
    </CapabilityGate>
  );
}
