import { ADMIN_AREAS } from '@/constants/admin';
import { withAudit } from '@/data/audit';
import { requireSupabase } from '@/data/supabaseClient';
import { newId, nowIso, unwrap } from '@/data/supabaseSupport';
import type {
  AcademicStanding,
  Programme,
  ScholarshipWindow,
  ScholarshipWindowInput,
} from '@/types/scholarships';

import type { ScholarshipsRepository } from './repository';

interface WindowRow {
  id: string;
  name: string;
  description: string;
  min_standing: AcademicStanding;
  programmes: Programme[];
  years_of_study: number[];
  opens_at: string;
  closes_at: string;
  updated_at: string;
}

const toWindow = (row: WindowRow): ScholarshipWindow => ({
  id: row.id,
  name: row.name,
  description: row.description,
  minStanding: row.min_standing,
  programmes: row.programmes,
  yearsOfStudy: row.years_of_study,
  opensAt: row.opens_at,
  closesAt: row.closes_at,
  updatedAt: row.updated_at,
});

const toColumns = (input: ScholarshipWindowInput) => ({
  name: input.name,
  description: input.description,
  min_standing: input.minStanding,
  programmes: input.programmes,
  years_of_study: input.yearsOfStudy,
  opens_at: input.opensAt,
  closes_at: input.closesAt,
});

/**
 * Supabase-backed scholarship windows (SA.13, F-01). Ordered by open date.
 * Every write records to the S003 audit seam.
 */
export class SupabaseScholarshipsRepository implements ScholarshipsRepository {
  async list(): Promise<ScholarshipWindow[]> {
    const sb = requireSupabase();
    const rows = unwrap<WindowRow[]>(
      await sb.from('scholarship_windows').select('*').order('opens_at'),
    );
    return rows.map(toWindow);
  }

  async create(input: ScholarshipWindowInput): Promise<ScholarshipWindow> {
    const sb = requireSupabase();
    const id = newId();
    return withAudit(
      {
        area: ADMIN_AREAS.SCHOLARSHIPS,
        action: 'window.created',
        summary: `Added the "${input.name}" scholarship window`,
        reference: id,
      },
      async () => {
        const row = unwrap<WindowRow>(
          await sb
            .from('scholarship_windows')
            .insert({ id, ...toColumns(input), updated_at: nowIso() })
            .select('*')
            .single(),
        );
        return toWindow(row);
      },
    );
  }

  async update(id: string, input: ScholarshipWindowInput): Promise<ScholarshipWindow> {
    const sb = requireSupabase();
    return withAudit(
      {
        area: ADMIN_AREAS.SCHOLARSHIPS,
        action: 'window.updated',
        summary: `Updated the "${input.name}" scholarship window`,
        reference: id,
      },
      async () => {
        const row = unwrap<WindowRow>(
          await sb
            .from('scholarship_windows')
            .update({ ...toColumns(input), updated_at: nowIso() })
            .eq('id', id)
            .select('*')
            .single(),
        );
        return toWindow(row);
      },
    );
  }

  async remove(id: string): Promise<void> {
    const sb = requireSupabase();
    const existing = toWindow(
      unwrap<WindowRow>(await sb.from('scholarship_windows').select('*').eq('id', id).single()),
    );
    await withAudit(
      {
        area: ADMIN_AREAS.SCHOLARSHIPS,
        action: 'window.deleted',
        summary: `Deleted the "${existing.name}" scholarship window`,
        reference: id,
      },
      async () => {
        const { error } = await sb.from('scholarship_windows').delete().eq('id', id);
        if (error) throw new Error(error.message);
      },
    );
  }
}
