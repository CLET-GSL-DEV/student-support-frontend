import { GET, POST } from '@starter/api-client';

import type { AppRelease, AuditResultInput, ReleaseInput } from '@/types/releases';

/**
 * Release governance endpoint definitions, consumed only by the
 * ApiReleasesRepository stub (src/data/releases/api.ts).
 * // TODO(integration): App Store / Play Store release pipeline (DTI-owned)
 * plus S001 IAM for the DG step-up approval; paths and shapes are
 * placeholders until the governance contract is published.
 */
export const releasesKeys = {
  all: ['releases'] as const,
  list: () => [...releasesKeys.all, 'list'] as const,
} as const;

export const releasesEndpoints = {
  list: GET<AppRelease[]>({
    path: '/admin/releases',
    queryKey: releasesKeys.list(),
  }),
  create: POST<AppRelease, ReleaseInput>({
    path: '/admin/releases',
    invalidates: [releasesKeys.list()],
  }),
  requestAudit: POST<AppRelease, never>({
    path: (params) => `/admin/releases/${params.id}/request-audit`,
    invalidates: [releasesKeys.list()],
  }),
  recordAuditResult: POST<AppRelease, AuditResultInput>({
    path: (params) => `/admin/releases/${params.id}/audit-result`,
    invalidates: [releasesKeys.list()],
  }),
  approve: POST<AppRelease, never>({
    path: (params) => `/admin/releases/${params.id}/approve`,
    invalidates: [releasesKeys.list()],
  }),
  markSubmitted: POST<AppRelease, never>({
    path: (params) => `/admin/releases/${params.id}/submit`,
    invalidates: [releasesKeys.list()],
  }),
} as const;
