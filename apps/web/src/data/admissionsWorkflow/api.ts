import { createService } from '@starter/api-client';

import { admissionsWorkflowEndpoints } from '@/api/admissionsWorkflow';
import { api } from '@/config/api';
import type { AdmissionsWorkflowStage, StagePresentationInput } from '@/types/admissionsWorkflow';

import type { AdmissionsWorkflowRepository } from './repository';

/**
 * Api stub routing through the base's gateway client.
 * // TODO(integration): S027 NLEMS; the backend records the S003 audit
 * entries for these writes (§5.1).
 */
export class ApiAdmissionsWorkflowRepository implements AdmissionsWorkflowRepository {
  private readonly listService = createService(admissionsWorkflowEndpoints.list, api);
  private readonly updateStageService = createService(admissionsWorkflowEndpoints.updateStage, api);

  list(): Promise<AdmissionsWorkflowStage[]> {
    return this.listService();
  }

  updateStage(id: string, input: StagePresentationInput): Promise<AdmissionsWorkflowStage> {
    return this.updateStageService({ params: { id }, body: input });
  }
}
