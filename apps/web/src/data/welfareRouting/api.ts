import { createService } from '@starter/api-client';

import { welfareRoutingEndpoints } from '@/api/welfareRouting';
import { api } from '@/config/api';
import type { WelfareRoutingRule, WelfareRoutingRuleInput } from '@/types/welfareRouting';

import type { WelfareRoutingRepository } from './repository';

/**
 * Api stub routing through the base's gateway client.
 * // TODO(integration): S031 Welfare CMS; the backend records the S003 audit
 * entries for these writes (§5.1).
 */
export class ApiWelfareRoutingRepository implements WelfareRoutingRepository {
  private readonly listService = createService(welfareRoutingEndpoints.list, api);
  private readonly createRuleService = createService(welfareRoutingEndpoints.create, api);
  private readonly updateRuleService = createService(welfareRoutingEndpoints.update, api);
  private readonly removeRuleService = createService(welfareRoutingEndpoints.remove, api);

  list(): Promise<WelfareRoutingRule[]> {
    return this.listService();
  }

  create(input: WelfareRoutingRuleInput): Promise<WelfareRoutingRule> {
    return this.createRuleService({ body: input });
  }

  update(id: string, input: WelfareRoutingRuleInput): Promise<WelfareRoutingRule> {
    return this.updateRuleService({ params: { id }, body: input });
  }

  async remove(id: string): Promise<void> {
    await this.removeRuleService({ params: { id } });
  }
}
