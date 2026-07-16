import { useSessionStore } from '@starter/auth';

import { ADMIN_AREAS } from '@/constants/admin';
import { withAudit } from '@/data/audit';
import { guardMockWrite, newId, nowIso, resolveScenario } from '@/data/support';
import {
  type AppRelease,
  type AuditResultInput,
  RELEASE_STATUSES,
  type ReleaseInput,
} from '@/types/releases';

import type { ReleasesRepository } from './repository';

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

/** // SPEC: the DG approver identity comes from S001 IAM in production; the
 * mock attributes approval to the signed-in profile. */
function currentApprover(): string {
  return useSessionStore.getState().user?.displayName ?? 'CLET DG (mock)';
}

const SEED_RELEASES: AppRelease[] = [
  {
    id: 'rel-1.5.0',
    version: '1.5.0',
    summary: 'Fee instalment plan display and payment reminder changes (SA.09)',
    platforms: ['ios', 'android'],
    statutoryImpacting: true,
    status: RELEASE_STATUSES.DRAFT,
    wcagAudit: { status: 'pending' },
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
  },
  {
    id: 'rel-1.4.0',
    version: '1.4.0',
    summary: 'Welfare crisis pathway improvements and enhanced SA.12 accessibility',
    platforms: ['ios', 'android'],
    statutoryImpacting: true,
    status: RELEASE_STATUSES.AWAITING_APPROVAL,
    wcagAudit: {
      status: 'passed',
      auditor: 'Accessible Ghana Ltd',
      reportRef: 'WCAG-2026-014',
      completedAt: daysAgo(6),
    },
    createdAt: daysAgo(14),
    updatedAt: daysAgo(6),
  },
  {
    id: 'rel-1.3.2',
    version: '1.3.2',
    summary: 'Timetable sync fixes and library barcode caching (SA.02, SA.11)',
    platforms: ['android'],
    statutoryImpacting: false,
    status: RELEASE_STATUSES.RELEASED,
    wcagAudit: {
      status: 'passed',
      auditor: 'Accessible Ghana Ltd',
      reportRef: 'WCAG-2026-011',
      completedAt: daysAgo(40),
    },
    createdAt: daysAgo(50),
    updatedAt: daysAgo(35),
  },
];

export class MockReleasesRepository implements ReleasesRepository {
  private releases: AppRelease[] = [...SEED_RELEASES];

  async list(): Promise<AppRelease[]> {
    const releases = await resolveScenario(this.releases, []);
    return [...releases].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  private replace(updated: AppRelease): AppRelease {
    this.releases = this.releases.map((release) => (release.id === updated.id ? updated : release));
    return updated;
  }

  private find(id: string): AppRelease {
    const release = this.releases.find((candidate) => candidate.id === id);
    if (!release) throw new Error('Release not found.');
    return release;
  }

  async create(input: ReleaseInput): Promise<AppRelease> {
    await guardMockWrite();
    const created: AppRelease = {
      ...input,
      id: newId(),
      status: RELEASE_STATUSES.DRAFT,
      wcagAudit: { status: 'pending' },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    return withAudit(
      {
        area: ADMIN_AREAS.RELEASES,
        action: 'release.created',
        summary: `Prepared app release ${input.version}`,
        reference: created.id,
      },
      async () => {
        this.releases = [created, ...this.releases];
        return created;
      },
    );
  }

  async requestAudit(id: string): Promise<AppRelease> {
    await guardMockWrite();
    const release = this.find(id);
    if (release.status !== RELEASE_STATUSES.DRAFT) {
      throw new Error('Only draft releases can be sent for a WCAG audit.');
    }
    const updated: AppRelease = {
      ...release,
      status: RELEASE_STATUSES.WCAG_AUDIT,
      updatedAt: nowIso(),
    };
    return withAudit(
      {
        area: ADMIN_AREAS.RELEASES,
        action: 'release.audit-requested',
        summary: `Submitted release ${release.version} for its WCAG 2.1 AA audit`,
        reference: id,
      },
      async () => this.replace(updated),
    );
  }

  async recordAuditResult(id: string, input: AuditResultInput): Promise<AppRelease> {
    await guardMockWrite();
    const release = this.find(id);
    if (release.status !== RELEASE_STATUSES.WCAG_AUDIT) {
      throw new Error('This release is not awaiting a WCAG audit result.');
    }
    const nextStatus = input.passed
      ? release.statutoryImpacting
        ? RELEASE_STATUSES.AWAITING_APPROVAL
        : RELEASE_STATUSES.APPROVED
      : RELEASE_STATUSES.REJECTED;
    const updated: AppRelease = {
      ...release,
      status: nextStatus,
      wcagAudit: {
        status: input.passed ? 'passed' : 'failed',
        auditor: input.auditor,
        reportRef: input.reportRef,
        completedAt: nowIso(),
      },
      updatedAt: nowIso(),
    };
    return withAudit(
      {
        area: ADMIN_AREAS.RELEASES,
        action: 'release.audit-recorded',
        summary: `Recorded a ${input.passed ? 'passed' : 'failed'} WCAG audit for release ${release.version}`,
        reference: id,
      },
      async () => this.replace(updated),
    );
  }

  async approve(id: string): Promise<AppRelease> {
    await guardMockWrite();
    const release = this.find(id);
    if (release.status !== RELEASE_STATUSES.AWAITING_APPROVAL) {
      throw new Error('This release is not awaiting DG approval.');
    }
    if (release.wcagAudit.status !== 'passed') {
      throw new Error('A passed WCAG 2.1 AA audit is required before approval (CON-L1).');
    }
    const updated: AppRelease = {
      ...release,
      status: RELEASE_STATUSES.APPROVED,
      approvedBy: currentApprover(),
      approvedAt: nowIso(),
      updatedAt: nowIso(),
    };
    return withAudit(
      {
        area: ADMIN_AREAS.RELEASES,
        action: 'release.approved',
        summary: `Approved statutory-impacting release ${release.version} (step-up verified)`,
        reference: id,
      },
      async () => this.replace(updated),
    );
  }

  async markSubmitted(id: string): Promise<AppRelease> {
    await guardMockWrite();
    const release = this.find(id);
    if (release.status !== RELEASE_STATUSES.APPROVED) {
      throw new Error('Only approved releases can be submitted to the stores.');
    }
    const updated: AppRelease = {
      ...release,
      status: RELEASE_STATUSES.SUBMITTED,
      updatedAt: nowIso(),
    };
    return withAudit(
      {
        area: ADMIN_AREAS.RELEASES,
        action: 'release.submitted',
        summary: `Submitted release ${release.version} to the app stores`,
        reference: id,
      },
      async () => this.replace(updated),
    );
  }
}
