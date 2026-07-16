import { DELETE, GET, POST, PUT } from '@starter/api-client';

import type { WelfareRoutingRule, WelfareRoutingRuleInput } from '@/types/welfareRouting';

/**
 * Welfare routing-rule endpoint definitions, consumed only by the
 * ApiWelfareRoutingRepository stub (src/data/welfareRouting/api.ts).
 * // TODO(integration): S031 Welfare CMS; paths and shapes are placeholders
 * until the S031 routing-config contract is published behind the S026
 * gateway. Rule payloads must never carry case content (CON-I2).
 */
export const welfareRoutingKeys = {
  all: ['welfare-routing'] as const,
  rules: () => [...welfareRoutingKeys.all, 'rules'] as const,
} as const;

export const welfareRoutingEndpoints = {
  list: GET<WelfareRoutingRule[]>({
    path: '/admin/welfare-routing-rules',
    queryKey: welfareRoutingKeys.rules(),
  }),
  create: POST<WelfareRoutingRule, WelfareRoutingRuleInput>({
    path: '/admin/welfare-routing-rules',
    invalidates: [welfareRoutingKeys.rules()],
  }),
  update: PUT<WelfareRoutingRule, WelfareRoutingRuleInput>({
    path: (params) => `/admin/welfare-routing-rules/${params.id}`,
    invalidates: [welfareRoutingKeys.rules()],
  }),
  remove: DELETE({
    path: (params) => `/admin/welfare-routing-rules/${params.id}`,
    invalidates: [welfareRoutingKeys.rules()],
  }),
} as const;
