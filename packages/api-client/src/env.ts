import { z } from 'zod';

export interface CreateEnvOptions {
  /**
   * When true (default), invalid env throws — use in production builds so a
   * misconfigured deploy fails fast instead of shipping broken config.
   * In dev you may pass false to warn-and-continue.
   */
  throwOnError?: boolean;
}

/**
 * Validate runtime environment against a Zod schema. Generalizes the per-app
 * `config/env.ts` pattern so every portal validates its env the same way.
 *
 * @example
 *   export const env = createEnv(
 *     z.object({ VITE_API_URL: z.string().url() }),
 *     import.meta.env,
 *     { throwOnError: import.meta.env.PROD },
 *   );
 */
export function createEnv<Schema extends z.ZodType>(
  schema: Schema,
  runtimeEnv: unknown,
  options: CreateEnvOptions = {},
): z.infer<Schema> {
  const { throwOnError = true } = options;
  const parsed = schema.safeParse(runtimeEnv);

  if (!parsed.success) {
    const fieldErrors = z.flattenError(parsed.error).fieldErrors;
    const message = `Invalid environment variables:\n${JSON.stringify(fieldErrors, null, 2)}`;
    if (throwOnError) {
      throw new Error(message);
    }
    console.warn(message);
    return runtimeEnv as z.infer<Schema>;
  }

  return parsed.data;
}
