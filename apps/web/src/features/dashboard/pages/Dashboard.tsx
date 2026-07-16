import { SectionDescription, SectionHeader, SectionTitle } from '@rfdtech/components';

import { ConfigAreaGrid, MetricsSummary } from '../components';

/**
 * Admin Portal landing (SRS §2.3, §2.6): aggregate usage summary and entry
 * points into every configuration area. No individual student data appears
 * here or anywhere else in this portal. The S003 change history lives on
 * the Audit Log screen.
 */
export function Component() {
  return (
    <div className="flex flex-col gap-6">
      <SectionHeader>
        <SectionTitle>Dashboard</SectionTitle>
        <SectionDescription>
          Aggregate service overview and configuration entry points for GSL Student Support.
        </SectionDescription>
      </SectionHeader>
      <MetricsSummary />
      <ConfigAreaGrid />
    </div>
  );
}
