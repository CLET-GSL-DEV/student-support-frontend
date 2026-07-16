import { DELETE, GET, POST, PUT } from '@starter/api-client';

import type { ScholarshipWindow, ScholarshipWindowInput } from '@/types/scholarships';

/**
 * Scholarship window endpoint definitions, consumed only by the
 * ApiScholarshipsRepository stub (src/data/scholarships/api.ts).
 * // TODO(integration): GSL Scholarship Management System; paths and shapes
 * are placeholders until its admin contract is published behind the S026
 * gateway.
 */
export const scholarshipsKeys = {
  all: ['scholarships'] as const,
  windows: () => [...scholarshipsKeys.all, 'windows'] as const,
} as const;

export const scholarshipsEndpoints = {
  list: GET<ScholarshipWindow[]>({
    path: '/admin/scholarship-windows',
    queryKey: scholarshipsKeys.windows(),
  }),
  create: POST<ScholarshipWindow, ScholarshipWindowInput>({
    path: '/admin/scholarship-windows',
    invalidates: [scholarshipsKeys.windows()],
  }),
  update: PUT<ScholarshipWindow, ScholarshipWindowInput>({
    path: (params) => `/admin/scholarship-windows/${params.id}`,
    invalidates: [scholarshipsKeys.windows()],
  }),
  remove: DELETE({
    path: (params) => `/admin/scholarship-windows/${params.id}`,
    invalidates: [scholarshipsKeys.windows()],
  }),
} as const;
