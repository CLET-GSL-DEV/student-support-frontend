import type { HostelAllocationRule, HostelAllocationRuleInput } from '@/types/hostelRules';

/**
 * Hostel allocation-rule configuration (SA.10, D-01). Every write records
 * to the S003 audit seam (§5.1).
 */
export interface HostelRulesRepository {
  list(): Promise<HostelAllocationRule[]>;
  create(input: HostelAllocationRuleInput): Promise<HostelAllocationRule>;
  update(id: string, input: HostelAllocationRuleInput): Promise<HostelAllocationRule>;
  remove(id: string): Promise<void>;
}
