import { useSessionStore } from '@starter/auth';

import type { AdminArea } from '@/constants/admin';
import { requireSupabase } from '@/data/supabaseClient';
import { unwrap } from '@/data/supabaseSupport';
import type { AuditEvent, AuditListQuery, NewAuditEvent } from '@/types/audit';

import type { AuditRepository } from './repository';

/** Fallback actor label when the IAM `/me` profile has not resolved. Never a
 * student identity; this portal has no student data surface (§2.3). */
const DEFAULT_ACTOR = 'GSL Student Support Administrator';

function currentActor(): string {
  return useSessionStore.getState().user?.displayName ?? DEFAULT_ACTOR;
}

interface AuditRow {
  id: string;
  occurred_at: string;
  actor: string;
  area: AdminArea;
  action: string;
  summary: string;
  reference: string | null;
}

const toEvent = (row: AuditRow): AuditEvent => ({
  id: row.id,
  occurredAt: row.occurred_at,
  actor: row.actor,
  area: row.area,
  action: row.action,
  summary: row.summary,
  reference: row.reference ?? undefined,
});

/**
 * Supabase-backed S003 audit trail (§5.1). Reads newest-first with optional
 * area/date filters; `record` stamps the signed-in actor and lets the DB fill
 * the id and occurred_at.
 */
export class SupabaseAuditRepository implements AuditRepository {
  async list(query?: AuditListQuery): Promise<AuditEvent[]> {
    const sb = requireSupabase();
    let q = sb.from('audit_events').select('*');
    if (query?.area) q = q.eq('area', query.area);
    if (query?.from) q = q.gte('occurred_at', query.from);
    if (query?.to) q = q.lte('occurred_at', query.to);
    const rows = unwrap<AuditRow[]>(await q.order('occurred_at', { ascending: false }));
    return rows.map(toEvent);
  }

  async record(event: NewAuditEvent): Promise<AuditEvent> {
    const sb = requireSupabase();
    const row = unwrap<AuditRow>(
      await sb
        .from('audit_events')
        .insert({
          actor: currentActor(),
          area: event.area,
          action: event.action,
          summary: event.summary,
          reference: event.reference ?? null,
        })
        .select('*')
        .single(),
    );
    return toEvent(row);
  }
}
