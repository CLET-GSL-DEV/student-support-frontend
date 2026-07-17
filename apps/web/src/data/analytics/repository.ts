import type { AnalyticsDetail, AnalyticsSummary } from '@/types/analytics';

/**
 * Aggregate-only analytics reads (SRS §2.3, §2.6). Read-only by design:
 * analytics is the one Admin Portal area with no writes, so it has no audit
 * seam and no student-level drill-down, ever.
 */
export interface AnalyticsRepository {
  getSummary(): Promise<AnalyticsSummary>;
  getDetail(): Promise<AnalyticsDetail>;
}
