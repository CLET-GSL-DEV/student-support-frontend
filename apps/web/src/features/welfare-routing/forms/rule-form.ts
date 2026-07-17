import { z } from 'zod';

import { REFERRAL_CATEGORIES, ROUTING_PRIORITIES } from '@/types/welfareRouting';

/** // SPEC: the rule schema is not in the SRS; fields mirror E-01's routing
 * and escalation responsibilities only. Nothing student-identifiable. */
export const ruleFormSchema = z.object({
  category: z.enum(REFERRAL_CATEGORIES),
  routeTo: z.string().min(1, 'Routing target is required'),
  escalateTo: z.string().min(1, 'Escalation target is required'),
  escalateAfterHours: z
    .number({ message: 'Enter the hours before escalation' })
    .int('Whole hours only')
    .min(1, 'Must be at least 1 hour')
    .max(168, 'Must be within one week (168 hours)'),
  priority: z.enum([ROUTING_PRIORITIES.STANDARD, ROUTING_PRIORITIES.CRISIS]),
  active: z.boolean(),
});

export type RuleFormValues = z.infer<typeof ruleFormSchema>;
