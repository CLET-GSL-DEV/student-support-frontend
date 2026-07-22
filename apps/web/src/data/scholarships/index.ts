import { resolveRepository } from '@/data/dataSource';

import { ApiScholarshipsRepository } from './api';
import { MockScholarshipsRepository } from './mock';
import type { ScholarshipsRepository } from './repository';
import { SupabaseScholarshipsRepository } from './supabase';

export type { ScholarshipsRepository } from './repository';

/** The active scholarship-windows repository (mock by default). */
export const scholarshipsRepository: ScholarshipsRepository =
  resolveRepository<ScholarshipsRepository>(
    new MockScholarshipsRepository(),
    new ApiScholarshipsRepository(),
    new SupabaseScholarshipsRepository(),
  );
