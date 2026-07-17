import { Button, MetricCard, Notice } from '@rfdtech/components';
import { useQuery } from '@tanstack/react-query';
import { Activity, BellRing, GraduationCap, HeartHandshake, type LucideIcon } from 'lucide-react';

import { analyticsKeys } from '@/api/analytics';
import { analyticsRepository } from '@/data/analytics';

/** Best-effort icon per metric key; falls back to a generic activity icon.
 * Purely cosmetic. */
const METRIC_ICONS: Record<string, LucideIcon> = {
  'active-students': Activity,
  'notifications-delivered': BellRing,
  'welfare-referrals': HeartHandshake,
  'scholarship-applications': GraduationCap,
};

const LOADING_PLACEHOLDER_COUNT = 4;

/**
 * Aggregate usage summary for the dashboard landing (SRS §2.3, §2.6:
 * aggregate only, never individual student data).
 * // SPEC: the exact metric set is not defined in the SRS; the repository
 * serves placeholder aggregates.
 */
export function MetricsSummary() {
  const summary = useQuery({
    queryKey: analyticsKeys.summary(),
    queryFn: () => analyticsRepository.getSummary(),
  });

  if (summary.isError) {
    return (
      <Notice variant="error" title="Aggregate metrics unavailable">
        <div className="flex flex-col items-start gap-2">
          <p>The analytics summary could not be loaded.</p>
          <Button variant="ghost" size="sm" onClick={() => void summary.refetch()}>
            Try again
          </Button>
        </div>
      </Notice>
    );
  }

  if (summary.data && summary.data.metrics.length === 0) {
    return (
      <Notice variant="info" title="No aggregate metrics yet">
        Usage aggregates will appear here once the student app starts reporting activity.
      </Notice>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {summary.isLoading
        ? Array.from({ length: LOADING_PLACEHOLDER_COUNT }, (_, index) => (
            <MetricCard key={index} variant="outline" label="" value="" loading />
          ))
        : summary.data?.metrics.map((metric) => {
            const Icon = METRIC_ICONS[metric.key] ?? Activity;
            return (
              <MetricCard
                key={metric.key}
                variant="outline"
                label={metric.label}
                value={metric.value}
                description={metric.description}
                icon={<Icon size={18} strokeWidth={2} aria-hidden />}
              />
            );
          })}
    </div>
  );
}
