import { GET } from '@starter/api-client';

import type { AnalyticsDetail, AnalyticsSummary } from '@/types/analytics';

/**
 * Aggregate analytics endpoint definitions, consumed only by the
 * ApiAnalyticsRepository stub (src/data/analytics/api.ts).
 * // TODO(integration): S028 aggregate analytics; the SRS names no analytics
 * service, only the aggregate-only constraint (§2.3, §2.6). Paths are
 * placeholders until DTI publishes the real source.
 */
export const analyticsKeys = {
  all: ['analytics'] as const,
  summary: () => [...analyticsKeys.all, 'summary'] as const,
  detail: () => [...analyticsKeys.all, 'detail'] as const,
} as const;

export const analyticsEndpoints = {
  summary: GET<AnalyticsSummary>({
    path: '/admin/analytics/summary',
    queryKey: analyticsKeys.summary(),
  }),
  detail: GET<AnalyticsDetail>({
    path: '/admin/analytics/detail',
    queryKey: analyticsKeys.detail(),
  }),
} as const;
