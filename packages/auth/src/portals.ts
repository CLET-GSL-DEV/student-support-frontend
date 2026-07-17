import { ROLES } from './roles';

/**
 * Every GSL Student Support portal, keyed by the ZITADEL role it's gated on. Each portal is a
 * separately deployed app on its own origin (see each `apps/*-portal/vite.config.ts`
 * for the matching dev port) — `INTERNAL_ASSESSOR` and `GTEC_ASSESSOR` share the Accessor
 * portal, matching `packages/auth/src/roles.ts`'s alias notes.
 *
 * Dev origins are hardcoded `localhost` ports, mirroring every portal's own
 * `vite.config.ts`. When each portal gets a real production domain, replace
 * these with env-driven values.
 */
export const PORTALS: Record<ROLES, { label: string; url: string }> = {
  [ROLES.SYSTEM_ADMIN]: { label: 'System Admin', url: 'http://localhost:5180' },
  [ROLES.AUDITOR]: { label: 'Auditor', url: 'http://localhost:5181' },
  [ROLES.REGISTRAR]: { label: 'Registrar', url: 'http://localhost:5182' },
  [ROLES.INTERNAL_ASSESSOR]: { label: 'Accessor', url: 'http://localhost:5183' },
  [ROLES.GTEC_ASSESSOR]: { label: 'Accessor', url: 'http://localhost:5183' },
  [ROLES.VERIFIER]: { label: 'Verifier', url: 'http://localhost:5184' },
  [ROLES.DIRECTOR_GENERAL]: { label: 'Director-General', url: 'http://localhost:5185' },
  [ROLES.CANDIDATE]: { label: 'Candidate', url: 'http://localhost:5186' },
  [ROLES.INSTITUTION_OFFICER]: { label: 'Institutional Officer', url: 'http://localhost:5187' },
};
