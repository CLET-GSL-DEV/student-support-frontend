import { resolveRepository } from '@/data/dataSource';

import { ApiAnalyticsRepository } from './api';
import { MockAnalyticsRepository } from './mock';
import type { AnalyticsRepository } from './repository';

export type { AnalyticsRepository } from './repository';

/** The active aggregate-analytics repository (mock by default). */
export const analyticsRepository: AnalyticsRepository = resolveRepository<AnalyticsRepository>(
  new MockAnalyticsRepository(),
  new ApiAnalyticsRepository(),
);
