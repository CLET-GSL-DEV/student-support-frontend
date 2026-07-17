import { GET, POST } from '@starter/api-client';

import type { AuditEvent, AuditListQuery, NewAuditEvent } from '@/types/audit';

/**
 * S003 Audit endpoint definitions, consumed only by the ApiAuditRepository
 * stub (src/data/audit/api.ts).
 * // TODO(integration): S003 Audit; paths and shapes are placeholders until
 * the S003 contract is published behind the S026 gateway.
 */
export const auditKeys = {
  all: ['audit'] as const,
  lists: () => [...auditKeys.all, 'list'] as const,
} as const;

export const auditEndpoints = {
  list: GET<AuditEvent[], AuditListQuery>({
    path: '/admin/audit-events',
    queryKey: auditKeys.lists(),
  }),
  record: POST<AuditEvent, NewAuditEvent>({
    path: '/admin/audit-events',
    invalidates: [auditKeys.lists()],
  }),
} as const;
