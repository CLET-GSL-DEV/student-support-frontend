import { resolveRepository } from '@/data/dataSource';

import { ApiAdmissionsWorkflowRepository } from './api';
import { MockAdmissionsWorkflowRepository } from './mock';
import type { AdmissionsWorkflowRepository } from './repository';
import { SupabaseAdmissionsWorkflowRepository } from './supabase';

export type { AdmissionsWorkflowRepository } from './repository';

/** The active admissions-workflow repository (mock by default). */
export const admissionsWorkflowRepository: AdmissionsWorkflowRepository =
  resolveRepository<AdmissionsWorkflowRepository>(
    new MockAdmissionsWorkflowRepository(),
    new ApiAdmissionsWorkflowRepository(),
    new SupabaseAdmissionsWorkflowRepository(),
  );
