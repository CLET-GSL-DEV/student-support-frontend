import { resolveRepository } from '@/data/dataSource';

import { ApiHostelRulesRepository } from './api';
import { MockHostelRulesRepository } from './mock';
import type { HostelRulesRepository } from './repository';
import { SupabaseHostelRulesRepository } from './supabase';

export type { HostelRulesRepository } from './repository';

/** The active hostel allocation-rules repository (mock by default). */
export const hostelRulesRepository: HostelRulesRepository =
  resolveRepository<HostelRulesRepository>(
    new MockHostelRulesRepository(),
    new ApiHostelRulesRepository(),
    new SupabaseHostelRulesRepository(),
  );
