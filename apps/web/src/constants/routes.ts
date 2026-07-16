import { GLOBAL_ROUTES } from '@starter/auth';

/**
 * Typesafe route paths for this app. A `const` object + union type, not a
 * real `enum` — this workspace's tsconfig has `erasableSyntaxOnly: true`,
 * which forbids real enums (they emit a runtime object; this compiles away
 * entirely).
 */
export const ROUTES = {
  ...GLOBAL_ROUTES,
  HOME: '/',
  DASHBOARD: '/dashboard',
} as const;

export type ROUTES = (typeof ROUTES)[keyof typeof ROUTES];
