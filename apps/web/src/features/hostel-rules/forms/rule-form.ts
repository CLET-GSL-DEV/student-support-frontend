import { z } from 'zod';

import { ALLOCATION_STRATEGIES, APPLICANT_GROUPS } from '@/types/hostelRules';

/** // SPEC: the rule schema is not in the SRS; placeholder fields covering
 * evaluation order, audience, strategy, and reserved room share. */
export const ruleFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  priority: z
    .number({ message: 'Enter the evaluation order' })
    .int('Whole numbers only')
    .min(1, 'Must be at least 1'),
  appliesTo: z.enum([
    APPLICANT_GROUPS.FIRST_YEAR,
    APPLICANT_GROUPS.CONTINUING,
    APPLICANT_GROUPS.ALL,
  ]),
  strategy: z.enum([
    ALLOCATION_STRATEGIES.BALLOT,
    ALLOCATION_STRATEGIES.FIRST_COME,
    ALLOCATION_STRATEGIES.NEED_BASED,
    ALLOCATION_STRATEGIES.MERIT_BASED,
  ]),
  reservedSharePercent: z
    .number({ message: 'Enter the reserved share' })
    .int('Whole percentages only')
    .min(0, 'Cannot be negative')
    .max(100, 'Cannot exceed 100 percent'),
  active: z.boolean(),
});

export type RuleFormValues = z.infer<typeof ruleFormSchema>;
