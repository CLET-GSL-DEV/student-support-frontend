import { DELETE, GET, POST, PUT } from '@starter/api-client';

import type { HostelAllocationRule, HostelAllocationRuleInput } from '@/types/hostelRules';

/**
 * Hostel allocation-rule endpoint definitions, consumed only by the
 * ApiHostelRulesRepository stub (src/data/hostelRules/api.ts).
 * // TODO(integration): GSL Hostel Management System (S120 or equivalent);
 * paths and shapes are placeholders until its admin contract is published
 * behind the S026 gateway.
 */
export const hostelRulesKeys = {
  all: ['hostel-rules'] as const,
  rules: () => [...hostelRulesKeys.all, 'rules'] as const,
} as const;

export const hostelRulesEndpoints = {
  list: GET<HostelAllocationRule[]>({
    path: '/admin/hostel-allocation-rules',
    queryKey: hostelRulesKeys.rules(),
  }),
  create: POST<HostelAllocationRule, HostelAllocationRuleInput>({
    path: '/admin/hostel-allocation-rules',
    invalidates: [hostelRulesKeys.rules()],
  }),
  update: PUT<HostelAllocationRule, HostelAllocationRuleInput>({
    path: (params) => `/admin/hostel-allocation-rules/${params.id}`,
    invalidates: [hostelRulesKeys.rules()],
  }),
  remove: DELETE({
    path: (params) => `/admin/hostel-allocation-rules/${params.id}`,
    invalidates: [hostelRulesKeys.rules()],
  }),
} as const;
