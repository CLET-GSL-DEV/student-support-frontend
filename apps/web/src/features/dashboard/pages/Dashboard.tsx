import { SectionDescription, SectionHeader, SectionTitle } from '@rfdtech/components';

import { AnalyticsDetailSection, MetricsSummary, QuickActions } from '../components';

/**
 * Admin Portal landing (SRS §2.3, §2.6): aggregate usage summary, editable
 * quick actions into the admin areas, and the aggregate analytics views
 * (module usage, notification delivery, weekly active students). Everything
 * here is aggregate only; no individual student data appears in this portal.
 * The S003 change history lives on the Audit Log screen.
 */
export function Component() {
  return (
    <div className="flex flex-col gap-6">
      <SectionHeader>
        <SectionTitle>Dashboard</SectionTitle>
        <SectionDescription>
          Aggregate service overview and quick access for GSL Student Support.
        </SectionDescription>
      </SectionHeader>
      <MetricsSummary />
      <QuickActions />
      <AnalyticsDetailSection />
    </div>
  );
}
