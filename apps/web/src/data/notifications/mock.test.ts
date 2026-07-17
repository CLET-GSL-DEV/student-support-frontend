import { afterEach, describe, expect, it, vi } from 'vitest';

import { auditRepository } from '@/data/audit';
import { useMockScenarioStore } from '@/stores';

import { MockNotificationsRepository } from './mock';

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

const input = { name: 'Events', description: 'Campus events', statutory: false };

afterEach(() => {
  useMockScenarioStore.getState().setScenario('populated');
});

describe('MockNotificationsRepository invariants', () => {
  it('pairs every configuration write with an S003 audit event', async () => {
    const repository = new MockNotificationsRepository();

    const created = await repository.createCategory({ ...input, name: 'Audit pairing probe' });
    await repository.updateCategory(created.id, { ...input, name: 'Audit pairing probe v2' });
    await repository.deleteCategory(created.id);

    const events = await auditRepository.list({ area: 'notifications' });
    const summaries = events.map((event) => event.summary);
    expect(summaries).toContain('Added notification category "Audit pairing probe"');
    expect(summaries).toContain('Updated notification category "Audit pairing probe v2"');
    expect(summaries).toContain('Deleted notification category "Audit pairing probe v2"');
  });

  it('refuses to make a statutory baseline category optional (G-02)', async () => {
    const repository = new MockNotificationsRepository();

    await expect(
      repository.updateCategory('cat-results', {
        name: 'Results',
        description: 'Academic results publication notices',
        statutory: false,
      }),
    ).rejects.toThrow(/G-02/);
  });

  it('refuses to delete a statutory baseline category (G-02)', async () => {
    const repository = new MockNotificationsRepository();

    await expect(repository.deleteCategory('cat-welfare-safety')).rejects.toThrow(/G-02/);
  });

  it('refuses to delete a category that still has templates', async () => {
    const repository = new MockNotificationsRepository();

    await expect(repository.deleteCategory('cat-fees')).rejects.toThrow(/templates/);
  });

  it('fails reads and writes under the error scenario', async () => {
    const repository = new MockNotificationsRepository();
    useMockScenarioStore.getState().setScenario('error');

    await expect(repository.listCategories()).rejects.toThrow();
    await expect(repository.createCategory(input)).rejects.toThrow();
  });

  it('serves empty collections under the empty scenario', async () => {
    const repository = new MockNotificationsRepository();
    useMockScenarioStore.getState().setScenario('empty');

    await expect(repository.listCategories()).resolves.toEqual([]);
    await expect(repository.listTemplates()).resolves.toEqual([]);
  });
});
