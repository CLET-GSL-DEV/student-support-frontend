import { env } from '@/config/env';

/**
 * Frontend-only delivery seam: every Admin Portal domain exposes a repository
 * interface with two implementations, a mock (dummy data, the default) and an
 * Api stub that routes through the base's gateway client via the declarative
 * endpoint definitions in src/api/*. This resolver picks the active one from
 * VITE_ADMIN_DATA_SOURCE.
 *
 * The endpoint factory remains the only API-calling pattern (the Api stubs
 * call createService over endpoint defs, never raw axios); the repository
 * layer exists solely so screens can ship against dummy data now and flip to
 * the real backend later without touching a component.
 *
 * // TODO(integration): flip VITE_ADMIN_DATA_SOURCE to 'api' per domain once
 * the corresponding backend contract exists behind the S026 gateway.
 */
export function resolveRepository<T>(mock: T, api: T): T {
  return env.adminDataSource === 'api' ? api : mock;
}
