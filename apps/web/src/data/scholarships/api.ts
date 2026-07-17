import { createService } from '@starter/api-client';

import { scholarshipsEndpoints } from '@/api/scholarships';
import { api } from '@/config/api';
import type { ScholarshipWindow, ScholarshipWindowInput } from '@/types/scholarships';

import type { ScholarshipsRepository } from './repository';

/**
 * Api stub routing through the base's gateway client.
 * // TODO(integration): GSL Scholarship Management System; the backend
 * records the S003 audit entries for these writes (§5.1).
 */
export class ApiScholarshipsRepository implements ScholarshipsRepository {
  private readonly listService = createService(scholarshipsEndpoints.list, api);
  private readonly createService = createService(scholarshipsEndpoints.create, api);
  private readonly updateService = createService(scholarshipsEndpoints.update, api);
  private readonly removeService = createService(scholarshipsEndpoints.remove, api);

  list(): Promise<ScholarshipWindow[]> {
    return this.listService();
  }

  create(input: ScholarshipWindowInput): Promise<ScholarshipWindow> {
    return this.createService({ body: input });
  }

  update(id: string, input: ScholarshipWindowInput): Promise<ScholarshipWindow> {
    return this.updateService({ params: { id }, body: input });
  }

  async remove(id: string): Promise<void> {
    await this.removeService({ params: { id } });
  }
}
