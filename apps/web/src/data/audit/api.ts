import { createService } from '@starter/api-client';

import { auditEndpoints } from '@/api/audit';
import { api } from '@/config/api';
import type { AuditEvent, AuditListQuery, NewAuditEvent } from '@/types/audit';

import type { AuditRepository } from './repository';

/**
 * Api stub routing through the base's gateway client via the declarative
 * endpoint definitions in src/api/audit.ts.
 * // TODO(integration): S003 Audit; becomes live when VITE_ADMIN_DATA_SOURCE
 * is flipped to 'api' and the S003 endpoints exist behind the S026 gateway.
 */
export class ApiAuditRepository implements AuditRepository {
  private readonly listService = createService(auditEndpoints.list, api);
  private readonly recordService = createService(auditEndpoints.record, api);

  list(query?: AuditListQuery): Promise<AuditEvent[]> {
    return this.listService({ query });
  }

  record(event: NewAuditEvent): Promise<AuditEvent> {
    return this.recordService({ body: event });
  }
}
