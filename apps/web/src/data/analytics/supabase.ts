import { requireSupabase } from '@/data/supabaseClient';
import { nowIso, unwrap } from '@/data/supabaseSupport';
import type {
  AggregateMetric,
  AnalyticsDetail,
  AnalyticsSummary,
  CategoryDelivery,
  ModuleUsage,
  WeeklyActivePoint,
} from '@/types/analytics';

import type { AnalyticsRepository } from './repository';

interface MetricRow {
  key: string;
  label: string;
  value: number;
  description: string;
  sort_order: number;
}
interface ModuleRow {
  module: string;
  label: string;
  sessions_30d: number;
  sort_order: number;
}
interface CategoryRow {
  category: string;
  delivered_30d: number;
  sort_order: number;
}
interface WeeklyRow {
  week_start: string;
  active_students: number;
}

/**
 * Supabase-backed aggregate analytics (§2.3/§2.6). Read-only, counts only,
 * never identities. `generatedAt` is stamped at read time.
 */
export class SupabaseAnalyticsRepository implements AnalyticsRepository {
  async getSummary(): Promise<AnalyticsSummary> {
    const sb = requireSupabase();
    const rows = unwrap<MetricRow[]>(
      await sb.from('analytics_summary_metrics').select('*').order('sort_order'),
    );
    const metrics: AggregateMetric[] = rows.map((row) => ({
      key: row.key,
      label: row.label,
      value: Number(row.value),
      description: row.description,
    }));
    return { generatedAt: nowIso(), metrics };
  }

  async getDetail(): Promise<AnalyticsDetail> {
    const sb = requireSupabase();
    const moduleRows = unwrap<ModuleRow[]>(
      await sb.from('analytics_module_usage').select('*').order('sort_order'),
    );
    const categoryRows = unwrap<CategoryRow[]>(
      await sb.from('analytics_category_delivery').select('*').order('sort_order'),
    );
    const weeklyRows = unwrap<WeeklyRow[]>(
      await sb.from('analytics_weekly_active').select('*').order('week_start'),
    );
    const moduleUsage: ModuleUsage[] = moduleRows.map((row) => ({
      module: row.module,
      label: row.label,
      sessions30d: Number(row.sessions_30d),
    }));
    const notificationsByCategory: CategoryDelivery[] = categoryRows.map((row) => ({
      category: row.category,
      delivered30d: Number(row.delivered_30d),
    }));
    const weeklyActive: WeeklyActivePoint[] = weeklyRows.map((row) => ({
      weekStart: row.week_start,
      activeStudents: Number(row.active_students),
    }));
    return { generatedAt: nowIso(), moduleUsage, notificationsByCategory, weeklyActive };
  }
}
