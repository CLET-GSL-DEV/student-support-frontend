import { Notice, SectionDescription, SectionHeader, SectionTitle } from '@rfdtech/components';
import { ShieldCheck } from 'lucide-react';

import { CapabilityGate } from '@/components/capability-gate';
import { CAPABILITIES } from '@/constants/admin';
import { MetricsSummary } from '@/features/dashboard/components';

import { AnalyticsDetailSection } from '../components';

/**
 * Aggregate usage analytics (SRS §2.3, §2.6): strictly aggregate, no
 * individual-student data anywhere. Read-only; there is no drill-down to
 * any identifiable record.
 */
export function Component() {
  return (
    <CapabilityGate capability={CAPABILITIES.ANALYTICS_VIEW}>
      <div className="flex flex-col gap-6">
        <SectionHeader>
          <SectionTitle>Analytics</SectionTitle>
          <SectionDescription>
            Aggregate usage across the student app. Counts and trends only.
          </SectionDescription>
        </SectionHeader>
        <Notice
          variant="info"
          title="Aggregate only"
          icon={<ShieldCheck size={18} strokeWidth={2} aria-hidden />}
          leftBorder
        >
          Analytics in this portal are aggregate by design (SRS §2.3, §2.6). There is no access to
          individual student activity, records, or identities, and no drill-down that could reveal
          them.
        </Notice>
        <MetricsSummary />
        <AnalyticsDetailSection />
      </div>
    </CapabilityGate>
  );
}
