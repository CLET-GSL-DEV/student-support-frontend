import { SectionDescription, SectionHeader, SectionTitle } from '@rfdtech/components';

import { CapabilityGate } from '@/components/capability-gate';
import { CAPABILITIES } from '@/constants/admin';

import { WindowsTable } from '../components';

/**
 * Scholarship windows configuration (SA.13; SRS §1.2, §2.3, F-01). Feeds the
 * GSL Scholarship Management System; the student app pre-filters listings by
 * academic standing from S027, programme, and year of study. Every write
 * records to the S003 audit seam.
 */
export function Component() {
  return (
    <CapabilityGate capability={CAPABILITIES.SCHOLARSHIPS_READ}>
      <div className="flex flex-col gap-6">
        <SectionHeader>
          <SectionTitle>Scholarship Windows</SectionTitle>
          <SectionDescription>
            Listings, eligibility parameters, and application windows consumed by the student app.
            Students only see scholarships whose eligibility they meet.
          </SectionDescription>
        </SectionHeader>
        <WindowsTable />
      </div>
    </CapabilityGate>
  );
}
