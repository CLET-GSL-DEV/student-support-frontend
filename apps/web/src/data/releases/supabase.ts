import { useSessionStore } from '@starter/auth';

import { ADMIN_AREAS } from '@/constants/admin';
import { withAudit } from '@/data/audit';
import { requireSupabase } from '@/data/supabaseClient';
import { newId, nowIso, unwrap } from '@/data/supabaseSupport';
import {
  type AppRelease,
  type AuditResultInput,
  type Platform,
  RELEASE_STATUSES,
  type ReleaseInput,
  type ReleaseStatus,
  type WcagAuditStatus,
} from '@/types/releases';

import type { ReleasesRepository } from './repository';

interface ReleaseRow {
  id: string;
  version: string;
  summary: string;
  platforms: Platform[];
  statutory_impacting: boolean;
  status: ReleaseStatus;
  wcag_status: WcagAuditStatus;
  wcag_auditor: string | null;
  wcag_report_ref: string | null;
  wcag_completed_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

const toRelease = (row: ReleaseRow): AppRelease => ({
  id: row.id,
  version: row.version,
  summary: row.summary,
  platforms: row.platforms,
  statutoryImpacting: row.statutory_impacting,
  status: row.status,
  wcagAudit: {
    status: row.wcag_status,
    auditor: row.wcag_auditor ?? undefined,
    reportRef: row.wcag_report_ref ?? undefined,
    completedAt: row.wcag_completed_at ?? undefined,
  },
  approvedBy: row.approved_by ?? undefined,
  approvedAt: row.approved_at ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/** // SPEC: the DG approver identity comes from S001 IAM in production; this
 * attributes approval to the signed-in profile. */
function currentApprover(): string {
  return useSessionStore.getState().user?.displayName ?? 'CLET DG (mock)';
}

/**
 * Supabase-backed release governance. Ports the mock's state-machine guards
 * (draft -> WCAG audit -> approval -> submitted) and refuses approval without a
 * passed WCAG audit (CON-L1). Every transition records to the S003 audit seam.
 */
export class SupabaseReleasesRepository implements ReleasesRepository {
  private async find(id: string): Promise<AppRelease> {
    const sb = requireSupabase();
    return toRelease(
      unwrap<ReleaseRow>(await sb.from('app_releases').select('*').eq('id', id).single()),
    );
  }

  private async patch(id: string, columns: Record<string, unknown>): Promise<AppRelease> {
    const sb = requireSupabase();
    return toRelease(
      unwrap<ReleaseRow>(
        await sb
          .from('app_releases')
          .update({ ...columns, updated_at: nowIso() })
          .eq('id', id)
          .select('*')
          .single(),
      ),
    );
  }

  async list(): Promise<AppRelease[]> {
    const sb = requireSupabase();
    const rows = unwrap<ReleaseRow[]>(
      await sb.from('app_releases').select('*').order('created_at', { ascending: false }),
    );
    return rows.map(toRelease);
  }

  async create(input: ReleaseInput): Promise<AppRelease> {
    const sb = requireSupabase();
    const id = newId();
    return withAudit(
      {
        area: ADMIN_AREAS.RELEASES,
        action: 'release.created',
        summary: `Prepared app release ${input.version}`,
        reference: id,
      },
      async () => {
        const now = nowIso();
        const row = unwrap<ReleaseRow>(
          await sb
            .from('app_releases')
            .insert({
              id,
              version: input.version,
              summary: input.summary,
              platforms: input.platforms,
              statutory_impacting: input.statutoryImpacting,
              status: RELEASE_STATUSES.DRAFT,
              wcag_status: 'pending',
              created_at: now,
              updated_at: now,
            })
            .select('*')
            .single(),
        );
        return toRelease(row);
      },
    );
  }

  async requestAudit(id: string): Promise<AppRelease> {
    const release = await this.find(id);
    if (release.status !== RELEASE_STATUSES.DRAFT) {
      throw new Error('Only draft releases can be sent for a WCAG audit.');
    }
    return withAudit(
      {
        area: ADMIN_AREAS.RELEASES,
        action: 'release.audit-requested',
        summary: `Submitted release ${release.version} for its WCAG 2.1 AA audit`,
        reference: id,
      },
      () => this.patch(id, { status: RELEASE_STATUSES.WCAG_AUDIT }),
    );
  }

  async recordAuditResult(id: string, input: AuditResultInput): Promise<AppRelease> {
    const release = await this.find(id);
    if (release.status !== RELEASE_STATUSES.WCAG_AUDIT) {
      throw new Error('This release is not awaiting a WCAG audit result.');
    }
    const nextStatus = input.passed
      ? release.statutoryImpacting
        ? RELEASE_STATUSES.AWAITING_APPROVAL
        : RELEASE_STATUSES.APPROVED
      : RELEASE_STATUSES.REJECTED;
    return withAudit(
      {
        area: ADMIN_AREAS.RELEASES,
        action: 'release.audit-recorded',
        summary: `Recorded a ${input.passed ? 'passed' : 'failed'} WCAG audit for release ${release.version}`,
        reference: id,
      },
      () =>
        this.patch(id, {
          status: nextStatus,
          wcag_status: input.passed ? 'passed' : 'failed',
          wcag_auditor: input.auditor,
          wcag_report_ref: input.reportRef,
          wcag_completed_at: nowIso(),
        }),
    );
  }

  async approve(id: string): Promise<AppRelease> {
    const release = await this.find(id);
    if (release.status !== RELEASE_STATUSES.AWAITING_APPROVAL) {
      throw new Error('This release is not awaiting DG approval.');
    }
    if (release.wcagAudit.status !== 'passed') {
      throw new Error('A passed WCAG 2.1 AA audit is required before approval (CON-L1).');
    }
    return withAudit(
      {
        area: ADMIN_AREAS.RELEASES,
        action: 'release.approved',
        summary: `Approved statutory-impacting release ${release.version} (step-up verified)`,
        reference: id,
      },
      () =>
        this.patch(id, {
          status: RELEASE_STATUSES.APPROVED,
          approved_by: currentApprover(),
          approved_at: nowIso(),
        }),
    );
  }

  async markSubmitted(id: string): Promise<AppRelease> {
    const release = await this.find(id);
    if (release.status !== RELEASE_STATUSES.APPROVED) {
      throw new Error('Only approved releases can be submitted to the stores.');
    }
    return withAudit(
      {
        area: ADMIN_AREAS.RELEASES,
        action: 'release.submitted',
        summary: `Submitted release ${release.version} to the app stores`,
        reference: id,
      },
      () => this.patch(id, { status: RELEASE_STATUSES.SUBMITTED }),
    );
  }
}
