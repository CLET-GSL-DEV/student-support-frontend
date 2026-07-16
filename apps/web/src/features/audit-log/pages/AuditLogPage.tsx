import { SectionDescription, SectionHeader, SectionTitle } from '@rfdtech/components';

import { CapabilityGate } from '@/components/capability-gate';
import { CAPABILITIES } from '@/constants/admin';

import { AuditLogTable } from '../components';

/**
 * S003 audit log (SRS §1.2, §5.1, CON-G): read-only history of every Admin
 * Portal configuration change and app release event. No student personal
 * data is ever logged (§5.1).
 */
export function Component() {
  return (
    <CapabilityGate capability={CAPABILITIES.AUDIT_READ}>
      <div className="flex flex-col gap-6">
        <SectionHeader>
          <SectionTitle>Audit Log</SectionTitle>
          <SectionDescription>
            Every configuration change and release event, recorded through S003. Read only.
          </SectionDescription>
        </SectionHeader>
        <AuditLogTable />
      </div>
    </CapabilityGate>
  );
}
