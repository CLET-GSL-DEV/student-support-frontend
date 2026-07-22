import { resolveRepository } from '@/data/dataSource';

import { ApiReleasesRepository } from './api';
import { MockReleasesRepository } from './mock';
import type { ReleasesRepository } from './repository';
import { SupabaseReleasesRepository } from './supabase';

export type { ReleasesRepository } from './repository';

/** The active release-governance repository (mock by default). */
export const releasesRepository: ReleasesRepository = resolveRepository<ReleasesRepository>(
  new MockReleasesRepository(),
  new ApiReleasesRepository(),
  new SupabaseReleasesRepository(),
);
