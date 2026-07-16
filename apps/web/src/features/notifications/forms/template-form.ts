import { z } from 'zod';

/** // SPEC: template field detail is not in the SRS; push/inbox split
 * mirrors the G-03 content-minimisation split between lock-screen payloads
 * and the authenticated inbox. */
export const templateFormSchema = z.object({
  categoryId: z.string().min(1, 'Select a category'),
  name: z.string().min(1, 'Name is required'),
  pushTitle: z.string().min(1, 'Push title is required'),
  pushBody: z.string().min(1, 'Push body is required'),
  inboxBody: z.string().min(1, 'Inbox body is required'),
});

export type TemplateFormValues = z.infer<typeof templateFormSchema>;
