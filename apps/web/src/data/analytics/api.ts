import { createService } from '@starter/api-client';

import { analyticsEndpoints } from '@/api/analytics';
import { api } from '@/config/api';
import type { AnalyticsDetail, AnalyticsSummary } from '@/types/analytics';

import type { AnalyticsRepository } from './repository';

/**
 * Api stub routing through the base's gateway client.
 * // TODO(integration): S028 aggregate analytics; becomes live when
 * VITE_ADMIN_DATA_SOURCE is flipped to 'api' and the analytics source exists
 * behind the S026 gateway.
 */
export class ApiAnalyticsRepository implements AnalyticsRepository {
  private readonly summaryService = createService(analyticsEndpoints.summary, api);
  private readonly detailService = createService(analyticsEndpoints.detail, api);

  getSummary(): Promise<AnalyticsSummary> {
    return this.summaryService();
  }

  getDetail(): Promise<AnalyticsDetail> {
    return this.detailService();
  }
}
