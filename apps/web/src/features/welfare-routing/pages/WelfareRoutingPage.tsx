import { Notice, SectionDescription, SectionHeader, SectionTitle } from '@rfdtech/components';
import { ShieldCheck } from 'lucide-react';

import { CapabilityGate } from '@/components/capability-gate';
import { CAPABILITIES } from '@/constants/admin';

import { RulesTable } from '../components';

/**
 * Welfare self-referral routing configuration (SA.12; SRS §1.2, §2.3, E-01,
 * NFR-PR). Routing rules only: this portal has no access to welfare cases,
 * messages, statuses, or any student-identifiable data (CON-I2 enforces
 * this at the S026 response-schema level). Every write records to the S003
 * audit seam.
 */
export function Component() {
  return (
    <CapabilityGate capability={CAPABILITIES.WELFARE_ROUTING_READ}>
      <div className="flex flex-col gap-6">
        <SectionHeader>
          <SectionTitle>Welfare Routing</SectionTitle>
          <SectionDescription>
            Where SA.12 self-referrals are routed and escalated inside S031. Configuration only.
          </SectionDescription>
        </SectionHeader>
        <Notice
          variant="info"
          title="No case data in this portal"
          icon={<ShieldCheck size={18} strokeWidth={2} aria-hidden />}
          leftBorder
        >
          This screen configures routing targets and escalation only. Welfare cases, messages, case
          statuses, and anything student-identifiable stay inside S031 and never appear here (SRS
          §2.3, E-01, CON-I2).
        </Notice>
        <RulesTable />
      </div>
    </CapabilityGate>
  );
}
