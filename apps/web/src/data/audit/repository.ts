import type { AuditEvent, AuditListQuery, NewAuditEvent } from '@/types/audit';

/**
 * The S003 audit seam (SRS §5.1). Every configuration write in the Admin
 * Portal must record through this interface; domain repositories bake the
 * call into their write methods so no config change can be silent.
 */
export interface AuditRepository {
  /** Newest first. */
  list(query?: AuditListQuery): Promise<AuditEvent[]>;
  record(event: NewAuditEvent): Promise<AuditEvent>;
}
