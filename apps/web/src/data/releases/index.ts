import { resolveRepository } from '@/data/dataSource';

import { ApiReleasesRepository } from './api';
import { MockReleasesRepository } from './mock';
import type { ReleasesRepository } from './repository';

export type { ReleasesRepository } from './repository';

/** The active release-governance repository (mock by default). */
export const releasesRepository: ReleasesRepository = resolveRepository<ReleasesRepository>(
  new MockReleasesRepository(),
  new ApiReleasesRepository(),
);
