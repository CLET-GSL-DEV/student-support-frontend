/**
 * Aggregate-only analytics shapes (SRS §2.3, §2.6: the administrator sees
 * aggregate usage analytics only, never individual student data). Nothing in
 * these types may ever carry a student identifier.
 * // SPEC: the metric set is not defined in the SRS; these are placeholders
 * pending the Admin Portal requirements document.
 */
export interface AggregateMetric {
  key: string;
  label: string;
  value: number;
  /** One-line qualifier shown under the value, e.g. the aggregation window. */
  description: string;
}

export interface AnalyticsSummary {
  /** ISO 8601 timestamp the aggregates were computed at. */
  generatedAt: string;
  metrics: AggregateMetric[];
}

/** Sessions per SA module over the last 30 days, aggregate counts only. */
export interface ModuleUsage {
  module: string;
  label: string;
  sessions30d: number;
}

/** Deliveries per notification category over the last 30 days. */
export interface CategoryDelivery {
  category: string;
  delivered30d: number;
}

/** Weekly unique active students; counts only, no identities. */
export interface WeeklyActivePoint {
  /** ISO date of the week's Monday. */
  weekStart: string;
  activeStudents: number;
}

export interface AnalyticsDetail {
  generatedAt: string;
  moduleUsage: ModuleUsage[];
  notificationsByCategory: CategoryDelivery[];
  weeklyActive: WeeklyActivePoint[];
}
