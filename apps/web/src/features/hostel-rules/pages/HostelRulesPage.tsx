import { SectionDescription, SectionHeader, SectionTitle } from '@rfdtech/components';

import { CapabilityGate } from '@/components/capability-gate';
import { CAPABILITIES } from '@/constants/admin';

import { RulesTable } from '../components';

/**
 * Hostel/hall allocation-rule configuration (SA.10; SRS §1.2, §2.3, D-01).
 * Rules feed the GSL Hostel Management System, which performs the actual
 * allocation; individual assignments never appear in this portal. Every
 * write records to the S003 audit seam.
 */
export function Component() {
  return (
    <CapabilityGate capability={CAPABILITIES.HOSTEL_RULES_READ}>
      <div className="flex flex-col gap-6">
        <SectionHeader>
          <SectionTitle>Hostel Allocation</SectionTitle>
          <SectionDescription>
            Rules the hostel system evaluates, in order, when allocating halls and rooms. The
            student app displays the resulting assignment in SA.10.
          </SectionDescription>
        </SectionHeader>
        <RulesTable />
      </div>
    </CapabilityGate>
  );
}
