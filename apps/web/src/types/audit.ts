import type { AdminArea } from '@/constants/admin';

/**
 * S003 audit trail shapes (SRS §5.1: S003 logs all Admin Portal configuration
 * changes and app release events; no student personal data is logged).
 * // SPEC: field-level shape is a placeholder until the S003 contract is
 * published; verify names against the real spec before integration.
 */
export interface AuditEvent {
  id: string;
  /** ISO 8601 timestamp of when the change happened. */
  occurredAt: string;
  /** Display name of the administrator who made the change. Never contains
   * student data (§5.1). */
  actor: string;
  area: AdminArea;
  /** Machine-readable verb, e.g. 'template.updated', 'window.opened'. */
  action: string;
  /** Human-readable one-liner, e.g. 'Updated the Results notification template'. */
  summary: string;
  /** Optional id of the configuration entity the change touched. */
  reference?: string;
}

/** What a configuration write supplies; id, timestamp, and actor are filled
 * by the audit seam (mock) or the backend (real S003). */
export type NewAuditEvent = Omit<AuditEvent, 'id' | 'occurredAt' | 'actor'>;

export interface AuditListQuery {
  area?: AdminArea;
  /** ISO date (inclusive) lower bound. */
  from?: string;
  /** ISO date (inclusive) upper bound. */
  to?: string;
}
