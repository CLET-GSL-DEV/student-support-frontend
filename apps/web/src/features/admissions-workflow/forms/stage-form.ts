import { z } from 'zod';

/** Presentation-only edits (B-01): the stage set and transitions stay owned
 * by S027. // SPEC: editable-workflow detail is not in the SRS. */
export const stageFormSchema = z.object({
  applicantLabel: z.string().min(1, 'Applicant label is required'),
  applicantDescription: z.string().min(1, 'Applicant description is required'),
  notifyOnEnter: z.boolean(),
});

export type StageFormValues = z.infer<typeof stageFormSchema>;
