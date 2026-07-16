import { createService } from '@starter/api-client';

import { hostelRulesEndpoints } from '@/api/hostelRules';
import { api } from '@/config/api';
import type { HostelAllocationRule, HostelAllocationRuleInput } from '@/types/hostelRules';

import type { HostelRulesRepository } from './repository';

/**
 * Api stub routing through the base's gateway client.
 * // TODO(integration): GSL Hostel Management System (S120 or equivalent);
 * the backend records the S003 audit entries for these writes (§5.1).
 */
export class ApiHostelRulesRepository implements HostelRulesRepository {
  private readonly listService = createService(hostelRulesEndpoints.list, api);
  private readonly createRuleService = createService(hostelRulesEndpoints.create, api);
  private readonly updateRuleService = createService(hostelRulesEndpoints.update, api);
  private readonly removeRuleService = createService(hostelRulesEndpoints.remove, api);

  list(): Promise<HostelAllocationRule[]> {
    return this.listService();
  }

  create(input: HostelAllocationRuleInput): Promise<HostelAllocationRule> {
    return this.createRuleService({ body: input });
  }

  update(id: string, input: HostelAllocationRuleInput): Promise<HostelAllocationRule> {
    return this.updateRuleService({ params: { id }, body: input });
  }

  async remove(id: string): Promise<void> {
    await this.removeRuleService({ params: { id } });
  }
}
