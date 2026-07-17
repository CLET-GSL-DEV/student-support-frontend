import { z } from 'zod';

export const categoryFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  statutory: z.boolean(),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
