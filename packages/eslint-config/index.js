import js from '@eslint/js';
import tseslint from 'typescript-eslint';

/**
 * Base flat config shared by every package/app in the monorepo.
 * Includes security-adjacent rules to keep enterprise code safe by default.
 */
export const baseConfig = tseslint.config(
  { ignores: ['dist', 'coverage', 'build', '.turbo', 'playwright-report'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Security hardening — forbid dynamic code execution and unsafe patterns.
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Stores must be imported from their barrel to keep boundaries clean.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['*/stores/*'],
              message:
                'Stores should only be imported from the index file (e.g., "@/stores" or "./stores").',
            },
          ],
        },
      ],
    },
  },
);

export default baseConfig;
