import { useMemo } from 'react';

import {
  Card,
  CardHeader,
  CardTitle,
  Notice,
  Table,
  type TableColumn,
  TableContent,
} from '@rfdtech/components';
import { useQuery } from '@tanstack/react-query';
import { Activity } from 'lucide-react';

import { formatDate } from '@starter/utils';

import { analyticsKeys } from '@/api/analytics';
import { QueryErrorNotice } from '@/components/query-error';
import { analyticsRepository } from '@/data/analytics';
import type { WeeklyActivePoint } from '@/types/analytics';

import { DistributionCard } from './DistributionCard';

/**
 * The aggregate analytics views (SRS §2.3, §2.6): module usage, notification
 * delivery by category, and the weekly active-students trend. Aggregate
 * counts only.
 * // SPEC: the metric set is not defined in the SRS; placeholder aggregates.
 */
export function AnalyticsDetailSection() {
  const detail = useQuery({
    queryKey: analyticsKeys.detail(),
    queryFn: () => analyticsRepository.getDetail(),
  });

  const weeklyColumns = useMemo<TableColumn<WeeklyActivePoint>[]>(
    () => [
      {
        id: 'weekStart',
        header: 'Week starting',
        accessorFn: (point) => formatDate(new Date(point.weekStart), { dateStyle: 'medium' }),
      },
      {
        id: 'activeStudents',
        header: 'Active students',
        align: 'right',
        accessorFn: (point) => new Intl.NumberFormat('en-GH').format(point.activeStudents),
      },
    ],
    [],
  );

  if (detail.isError) {
    return <QueryErrorNotice title="Analytics unavailable" onRetry={() => void detail.refetch()} />;
  }

  const isEmpty =
    detail.data &&
    detail.data.moduleUsage.length === 0 &&
    detail.data.notificationsByCategory.length === 0 &&
    detail.data.weeklyActive.length === 0;

  if (isEmpty) {
    return (
      <Notice variant="info" title="No aggregate data yet">
        Usage aggregates will appear here once the student app starts reporting activity.
      </Notice>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <DistributionCard
        title="Module usage (last 30 days)"
        unit="sessions"
        rows={(detail.data?.moduleUsage ?? []).map((usage) => ({
          key: usage.module,
          label: `${usage.label} (${usage.module})`,
          value: usage.sessions30d,
        }))}
      />
      <div className="flex flex-col gap-6">
        <DistributionCard
          title="Notifications delivered by category (last 30 days)"
          unit="delivered"
          rows={(detail.data?.notificationsByCategory ?? []).map((delivery) => ({
            key: delivery.category,
            label: delivery.category,
            value: delivery.delivered30d,
          }))}
        />
        <Card className="flex flex-col gap-4">
          <CardHeader>
            <CardTitle>Weekly active students</CardTitle>
          </CardHeader>
          <Table paramPrefix="weekly-active">
            <TableContent
              variant="panel"
              columns={weeklyColumns}
              data={detail.data?.weeklyActive ?? []}
              rowKey={(point) => point.weekStart}
              loading={detail.isLoading}
              loadingRows={6}
              emptyIcon={<Activity size={20} strokeWidth={2} aria-hidden />}
              emptyText="No weekly activity yet"
            />
          </Table>
        </Card>
      </div>
    </div>
  );
}
