import { resolveRepository } from '@/data/dataSource';

import { ApiWelfareRoutingRepository } from './api';
import { MockWelfareRoutingRepository } from './mock';
import type { WelfareRoutingRepository } from './repository';

export type { WelfareRoutingRepository } from './repository';

/** The active welfare routing-rules repository (mock by default). */
export const welfareRoutingRepository: WelfareRoutingRepository =
  resolveRepository<WelfareRoutingRepository>(
    new MockWelfareRoutingRepository(),
    new ApiWelfareRoutingRepository(),
  );
