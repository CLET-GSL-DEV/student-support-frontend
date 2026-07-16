import { ADMIN_AREAS } from '@/constants/admin';
import { withAudit } from '@/data/audit';
import { guardMockWrite, newId, nowIso, resolveScenario } from '@/data/support';
import {
  ACADEMIC_STANDINGS,
  type ScholarshipWindow,
  type ScholarshipWindowInput,
} from '@/types/scholarships';

import type { ScholarshipsRepository } from './repository';

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

/** One open, one scheduled, one closed window so every lifecycle state is
 * visible under the 'populated' scenario. */
const SEED_WINDOWS: ScholarshipWindow[] = [
  {
    id: 'sch-merit',
    name: 'GSL Merit Scholarship',
    description: 'Full tuition award for top-performing students across both programmes',
    minStanding: ACADEMIC_STANDINGS.GOOD,
    programmes: ['LLB', 'LPT'],
    yearsOfStudy: [2, 3, 4],
    opensAt: daysFromNow(-10),
    closesAt: daysFromNow(20),
    updatedAt: daysFromNow(-10),
  },
  {
    id: 'sch-deans-bursary',
    name: 'Deans List Bursary',
    description: 'Partial bursary for LLB students on the deans list',
    minStanding: ACADEMIC_STANDINGS.GOOD,
    programmes: ['LLB'],
    yearsOfStudy: [2, 3, 4],
    opensAt: daysFromNow(14),
    closesAt: daysFromNow(45),
    updatedAt: daysFromNow(-3),
  },
  {
    id: 'sch-access-grant',
    name: 'Access Support Grant',
    description: 'Needs-based support open to all students in good or satisfactory standing',
    minStanding: ACADEMIC_STANDINGS.SATISFACTORY,
    programmes: ['LLB', 'LPT'],
    yearsOfStudy: [1, 2, 3, 4],
    opensAt: daysFromNow(-60),
    closesAt: daysFromNow(-5),
    updatedAt: daysFromNow(-60),
  },
];

export class MockScholarshipsRepository implements ScholarshipsRepository {
  private windows: ScholarshipWindow[] = [...SEED_WINDOWS];

  list(): Promise<ScholarshipWindow[]> {
    return resolveScenario(this.windows, []);
  }

  async create(input: ScholarshipWindowInput): Promise<ScholarshipWindow> {
    await guardMockWrite();
    const created: ScholarshipWindow = { ...input, id: newId(), updatedAt: nowIso() };
    return withAudit(
      {
        area: ADMIN_AREAS.SCHOLARSHIPS,
        action: 'window.created',
        summary: `Added the "${input.name}" scholarship window`,
        reference: created.id,
      },
      async () => {
        this.windows = [...this.windows, created];
        return created;
      },
    );
  }

  async update(id: string, input: ScholarshipWindowInput): Promise<ScholarshipWindow> {
    await guardMockWrite();
    const existing = this.windows.find((window) => window.id === id);
    if (!existing) throw new Error('Scholarship window not found.');
    const updated: ScholarshipWindow = { ...existing, ...input, updatedAt: nowIso() };
    return withAudit(
      {
        area: ADMIN_AREAS.SCHOLARSHIPS,
        action: 'window.updated',
        summary: `Updated the "${updated.name}" scholarship window`,
        reference: id,
      },
      async () => {
        this.windows = this.windows.map((window) => (window.id === id ? updated : window));
        return updated;
      },
    );
  }

  async remove(id: string): Promise<void> {
    await guardMockWrite();
    const existing = this.windows.find((window) => window.id === id);
    if (!existing) throw new Error('Scholarship window not found.');
    return withAudit(
      {
        area: ADMIN_AREAS.SCHOLARSHIPS,
        action: 'window.deleted',
        summary: `Deleted the "${existing.name}" scholarship window`,
        reference: id,
      },
      async () => {
        this.windows = this.windows.filter((window) => window.id !== id);
      },
    );
  }
}
