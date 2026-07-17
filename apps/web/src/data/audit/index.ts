import { resolveRepository } from '@/data/dataSource';
import type { NewAuditEvent } from '@/types/audit';

import { ApiAuditRepository } from './api';
import { MockAuditRepository } from './mock';
import type { AuditRepository } from './repository';

export type { AuditRepository } from './repository';

/** The active S003 audit repository (mock by default; see dataSource.ts). */
export const auditRepository: AuditRepository = resolveRepository<AuditRepository>(
  new MockAuditRepository(),
  new ApiAuditRepository(),
);

/**
 * The write-side S003 seam (SRS §5.1): every configuration write MUST call
 * this after the write succeeds; domain repositories bake it into their
 * write methods so no config change can be silent. Prefer `withAudit` below,
 * which enforces the ordering.
 * // TODO(integration): S003 Audit.
 */
export function recordAuditEvent(event: NewAuditEvent): Promise<unknown> {
  return auditRepository.record(event);
}

/**
 * Run a configuration write, then record its audit event. Domain repository
 * write methods wrap themselves in this so the write-then-audit pairing is
 * structural, not a per-call convention.
 */
export async function withAudit<T>(event: NewAuditEvent, write: () => Promise<T>): Promise<T> {
  const result = await write();
  await recordAuditEvent(event);
  return result;
}
