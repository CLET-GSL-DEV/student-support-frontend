import { z } from 'zod';

import { PLATFORMS } from '@/types/releases';

/** // SPEC: release metadata detail is not in the SRS. */
export const releaseFormSchema = z.object({
  version: z
    .string()
    .min(1, 'Version is required')
    .regex(/^\d+\.\d+\.\d+$/, 'Use semantic versioning, e.g. 1.5.0'),
  summary: z.string().min(1, 'Summary is required'),
  platforms: z.array(z.enum(PLATFORMS)).min(1, 'Select at least one store'),
  statutoryImpacting: z.boolean(),
});

export type ReleaseFormValues = z.infer<typeof releaseFormSchema>;

export const auditResultFormSchema = z.object({
  passed: z.boolean(),
  auditor: z.string().min(1, 'Independent assessor is required (CON-L1)'),
  reportRef: z.string().min(1, 'Audit report reference is required'),
});

export type AuditResultFormValues = z.infer<typeof auditResultFormSchema>;
