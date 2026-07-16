import { createService } from '@starter/api-client';

import { releasesEndpoints } from '@/api/releases';
import { api } from '@/config/api';
import type { AppRelease, AuditResultInput, ReleaseInput } from '@/types/releases';

import type { ReleasesRepository } from './repository';

/**
 * Api stub routing through the base's gateway client.
 * // TODO(integration): DTI release pipeline + S001 IAM step-up; the backend
 * records the S003 audit entries for these events (§5.1) and enforces the
 * CON-L1 WCAG gate and CON-G1 DG approval server-side.
 */
export class ApiReleasesRepository implements ReleasesRepository {
  private readonly listService = createService(releasesEndpoints.list, api);
  private readonly createReleaseService = createService(releasesEndpoints.create, api);
  private readonly requestAuditService = createService(releasesEndpoints.requestAudit, api);
  private readonly recordAuditService = createService(releasesEndpoints.recordAuditResult, api);
  private readonly approveService = createService(releasesEndpoints.approve, api);
  private readonly markSubmittedService = createService(releasesEndpoints.markSubmitted, api);

  list(): Promise<AppRelease[]> {
    return this.listService();
  }

  create(input: ReleaseInput): Promise<AppRelease> {
    return this.createReleaseService({ body: input });
  }

  requestAudit(id: string): Promise<AppRelease> {
    return this.requestAuditService({ params: { id } });
  }

  recordAuditResult(id: string, input: AuditResultInput): Promise<AppRelease> {
    return this.recordAuditService({ params: { id }, body: input });
  }

  approve(id: string): Promise<AppRelease> {
    return this.approveService({ params: { id } });
  }

  markSubmitted(id: string): Promise<AppRelease> {
    return this.markSubmittedService({ params: { id } });
  }
}
