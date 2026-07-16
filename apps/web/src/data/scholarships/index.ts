import { resolveRepository } from '@/data/dataSource';

import { ApiScholarshipsRepository } from './api';
import { MockScholarshipsRepository } from './mock';
import type { ScholarshipsRepository } from './repository';

export type { ScholarshipsRepository } from './repository';

/** The active scholarship-windows repository (mock by default). */
export const scholarshipsRepository: ScholarshipsRepository =
  resolveRepository<ScholarshipsRepository>(
    new MockScholarshipsRepository(),
    new ApiScholarshipsRepository(),
  );
