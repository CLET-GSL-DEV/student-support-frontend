import { GET, PUT } from '@starter/api-client';

import type { AdmissionsWorkflowStage, StagePresentationInput } from '@/types/admissionsWorkflow';

/**
 * Admissions workflow endpoint definitions, consumed only by the
 * ApiAdmissionsWorkflowRepository stub (src/data/admissionsWorkflow/api.ts).
 * // TODO(integration): S027 NLEMS; paths and shapes are placeholders until
 * the SA.01 workflow-presentation contract is published behind the S026
 * gateway.
 */
export const admissionsWorkflowKeys = {
  all: ['admissions-workflow'] as const,
  stages: () => [...admissionsWorkflowKeys.all, 'stages'] as const,
} as const;

export const admissionsWorkflowEndpoints = {
  list: GET<AdmissionsWorkflowStage[]>({
    path: '/admin/admissions-workflow/stages',
    queryKey: admissionsWorkflowKeys.stages(),
  }),
  updateStage: PUT<AdmissionsWorkflowStage, StagePresentationInput>({
    path: (params) => `/admin/admissions-workflow/stages/${params.id}`,
    invalidates: [admissionsWorkflowKeys.stages()],
  }),
} as const;
