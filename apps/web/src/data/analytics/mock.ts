import { nowIso, resolveScenario } from '@/data/support';
import type { AnalyticsDetail, AnalyticsSummary } from '@/types/analytics';

import type { AnalyticsRepository } from './repository';

function weeksAgo(weeks: number): string {
  const date = new Date(Date.now() - weeks * 7 * 24 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 10);
}

/**
 * Dummy aggregates. Counts only, never identities: the welfare figure is a
 * referral count with no case linkage (case content never leaves S031).
 * // SPEC: the metric set is not defined in the SRS.
 */
const SEED_SUMMARY: AnalyticsSummary = {
  generatedAt: nowIso(),
  metrics: [
    {
      key: 'active-students',
      label: 'Active students',
      value: 4820,
      description: 'Unique sessions in the last 7 days',
    },
    {
      key: 'notifications-delivered',
      label: 'Notifications delivered',
      value: 18240,
      description: 'Push and inbox deliveries in the last 30 days',
    },
    {
      key: 'welfare-referrals',
      label: 'Welfare referrals',
      value: 37,
      description: 'Submitted in the last 30 days, count only',
    },
    {
      key: 'scholarship-applications',
      label: 'Scholarship applications',
      value: 612,
      description: 'Submitted in the last 30 days',
    },
  ],
};

/** Aggregate module and delivery figures; counts only, never identities.
 * // SPEC: the metric set is not defined in the SRS. */
const SEED_DETAIL: AnalyticsDetail = {
  generatedAt: nowIso(),
  moduleUsage: [
    { module: 'SA.02', label: 'My Schedule', sessions30d: 21400 },
    { module: 'SA.08', label: 'Notifications', sessions30d: 18900 },
    { module: 'SA.04', label: 'Grades and Transcript', sessions30d: 16200 },
    { module: 'SA.09', label: 'Fees and Payments', sessions30d: 9800 },
    { module: 'SA.01', label: 'Admissions Status', sessions30d: 7400 },
    { module: 'SA.11', label: 'Library', sessions30d: 6300 },
    { module: 'SA.10', label: 'Hostel', sessions30d: 4100 },
    { module: 'SA.13', label: 'Scholarships', sessions30d: 3900 },
    { module: 'SA.12', label: 'Welfare and Counselling', sessions30d: 1200 },
  ],
  notificationsByCategory: [
    { category: 'Results', delivered30d: 5200 },
    { category: 'Exam Notices', delivered30d: 4100 },
    { category: 'Fees', delivered30d: 3600 },
    { category: 'Admission Decisions', delivered30d: 2400 },
    { category: 'Library', delivered30d: 1500 },
    { category: 'Scholarships', delivered30d: 900 },
    { category: 'Welfare Safety Alerts', delivered30d: 540 },
  ],
  weeklyActive: [
    { weekStart: weeksAgo(6), activeStudents: 4300 },
    { weekStart: weeksAgo(5), activeStudents: 4450 },
    { weekStart: weeksAgo(4), activeStudents: 4620 },
    { weekStart: weeksAgo(3), activeStudents: 4510 },
    { weekStart: weeksAgo(2), activeStudents: 4700 },
    { weekStart: weeksAgo(1), activeStudents: 4820 },
  ],
};

const EMPTY_DETAIL: AnalyticsDetail = {
  generatedAt: nowIso(),
  moduleUsage: [],
  notificationsByCategory: [],
  weeklyActive: [],
};

export class MockAnalyticsRepository implements AnalyticsRepository {
  getSummary(): Promise<AnalyticsSummary> {
    return resolveScenario(SEED_SUMMARY, { generatedAt: nowIso(), metrics: [] });
  }

  getDetail(): Promise<AnalyticsDetail> {
    return resolveScenario(SEED_DETAIL, EMPTY_DETAIL);
  }
}
