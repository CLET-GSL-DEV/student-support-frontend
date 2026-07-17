import { describe, expect, it, vi } from 'vitest';

import { auditRepository } from '@/data/audit';

import { MockReleasesRepository } from './mock';

// Hermetic env: the data layer transitively imports @/config/env, whose zod
// schema requires ZITADEL URLs that only exist in a real .env.
vi.mock('@/config/env', () => ({
  env: {
    apiUrl: '/api/app',
    iamUrl: '/api/iam',
    appEnv: 'development',
    sentryDsn: '',
    sessionCheckEnabled: false,
    zitadel: {
      authority: 'http://localhost:8080',
      clientId: '',
      redirectUri: 'http://localhost:5290/auth/callback',
      postLogoutRedirectUri: 'http://localhost:5290/auth/logout/callback',
      projectId: '',
    },
    adminDataSource: 'mock',
    adminMockScenario: 'populated',
  },
}));

const auditResult = { passed: true, auditor: 'Accessible Ghana Ltd', reportRef: 'WCAG-TEST-1' };

describe('MockReleasesRepository governance state machine', () => {
  it('walks a statutory release through audit, DG approval, and submission', async () => {
    const repository = new MockReleasesRepository();
    const release = await repository.create({
      version: '9.9.9',
      summary: 'Statutory probe',
      platforms: ['ios'],
      statutoryImpacting: true,
    });

    const inAudit = await repository.requestAudit(release.id);
    expect(inAudit.status).toBe('wcag-audit');

    const awaiting = await repository.recordAuditResult(release.id, auditResult);
    expect(awaiting.status).toBe('awaiting-approval');

    const approved = await repository.approve(release.id);
    expect(approved.status).toBe('approved');
    expect(approved.approvedBy).toBeTruthy();

    const submitted = await repository.markSubmitted(release.id);
    expect(submitted.status).toBe('submitted');

    const events = await auditRepository.list({ area: 'releases' });
    expect(events.map((event) => event.summary)).toContain(
      'Approved statutory-impacting release 9.9.9 (step-up verified)',
    );
  });

  it('skips DG approval for non-statutory releases once the WCAG audit passes', async () => {
    const repository = new MockReleasesRepository();
    const release = await repository.create({
      version: '9.9.8',
      summary: 'Non-statutory probe',
      platforms: ['android'],
      statutoryImpacting: false,
    });

    await repository.requestAudit(release.id);
    const approved = await repository.recordAuditResult(release.id, auditResult);
    expect(approved.status).toBe('approved');
  });

  it('rejects a release whose WCAG audit fails (CON-L1)', async () => {
    const repository = new MockReleasesRepository();
    const release = await repository.create({
      version: '9.9.7',
      summary: 'Failing audit probe',
      platforms: ['ios'],
      statutoryImpacting: true,
    });

    await repository.requestAudit(release.id);
    const rejected = await repository.recordAuditResult(release.id, {
      ...auditResult,
      passed: false,
    });
    expect(rejected.status).toBe('rejected');
    await expect(repository.approve(release.id)).rejects.toThrow();
  });

  it('refuses out-of-order transitions', async () => {
    const repository = new MockReleasesRepository();
    const release = await repository.create({
      version: '9.9.6',
      summary: 'Ordering probe',
      platforms: ['ios'],
      statutoryImpacting: true,
    });

    // Draft releases cannot be approved or submitted, and audit results
    // cannot be recorded before an audit is requested.
    await expect(repository.approve(release.id)).rejects.toThrow();
    await expect(repository.markSubmitted(release.id)).rejects.toThrow();
    await expect(repository.recordAuditResult(release.id, auditResult)).rejects.toThrow();

    // A release already in audit cannot be sent for audit again.
    await repository.requestAudit(release.id);
    await expect(repository.requestAudit(release.id)).rejects.toThrow();
  });
});
