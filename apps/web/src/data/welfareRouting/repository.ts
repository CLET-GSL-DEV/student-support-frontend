import type { WelfareRoutingRule, WelfareRoutingRuleInput } from '@/types/welfareRouting';

/**
 * Welfare routing configuration (SA.12, E-01): routing targets and
 * escalation only. No welfare case data crosses this interface, ever
 * (CON-I2, NFR-PR). Every write records to the S003 audit seam (§5.1).
 */
export interface WelfareRoutingRepository {
  list(): Promise<WelfareRoutingRule[]>;
  create(input: WelfareRoutingRuleInput): Promise<WelfareRoutingRule>;
  update(id: string, input: WelfareRoutingRuleInput): Promise<WelfareRoutingRule>;
  remove(id: string): Promise<void>;
}
