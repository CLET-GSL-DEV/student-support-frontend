import { z } from 'zod';

import { ACADEMIC_STANDINGS, PROGRAMMES } from '@/types/scholarships';

/** // SPEC: eligibility field detail is not in the SRS; parameters mirror
 * F-01's pre-filter inputs (academic standing, programme, year of study). */
export const windowFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  minStanding: z.enum([
    ACADEMIC_STANDINGS.ANY,
    ACADEMIC_STANDINGS.SATISFACTORY,
    ACADEMIC_STANDINGS.GOOD,
  ]),
  programmes: z.array(z.enum(PROGRAMMES)).min(1, 'Select at least one programme'),
  yearsOfStudy: z.array(z.number()).min(1, 'Select at least one year of study'),
  window: z
    .object({
      start: z.date().nullable(),
      end: z.date().nullable(),
    })
    .refine((range) => range.start !== null && range.end !== null, {
      message: 'Select the application window',
    })
    .refine((range) => range.start === null || range.end === null || range.start < range.end, {
      message: 'The window must close after it opens',
    }),
});

export type WindowFormValues = z.infer<typeof windowFormSchema>;
