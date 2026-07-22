import { ADMIN_AREAS } from '@/constants/admin';
import { withAudit } from '@/data/audit';
import { requireSupabase } from '@/data/supabaseClient';
import { newId, nowIso, unwrap } from '@/data/supabaseSupport';
import type {
  AllocationStrategy,
  ApplicantGroup,
  HostelAllocationRule,
  HostelAllocationRuleInput,
} from '@/types/hostelRules';

import type { HostelRulesRepository } from './repository';

interface RuleRow {
  id: string;
  name: string;
  description: string;
  priority: number;
  applies_to: ApplicantGroup;
  strategy: AllocationStrategy;
  reserved_share_percent: number;
  active: boolean;
  updated_at: string;
}

const toRule = (row: RuleRow): HostelAllocationRule => ({
  id: row.id,
  name: row.name,
  description: row.description,
  priority: row.priority,
  appliesTo: row.applies_to,
  strategy: row.strategy,
  reservedSharePercent: row.reserved_share_percent,
  active: row.active,
  updatedAt: row.updated_at,
});

const toColumns = (input: HostelAllocationRuleInput) => ({
  name: input.name,
  description: input.description,
  priority: input.priority,
  applies_to: input.appliesTo,
  strategy: input.strategy,
  reserved_share_percent: input.reservedSharePercent,
  active: input.active,
});

/**
 * Supabase-backed hostel allocation rules (SA.10, D-01). Ordered by priority.
 * Every write records to the S003 audit seam.
 */
export class SupabaseHostelRulesRepository implements HostelRulesRepository {
  async list(): Promise<HostelAllocationRule[]> {
    const sb = requireSupabase();
    const rows = unwrap<RuleRow[]>(
      await sb.from('hostel_allocation_rules').select('*').order('priority'),
    );
    return rows.map(toRule);
  }

  async create(input: HostelAllocationRuleInput): Promise<HostelAllocationRule> {
    const sb = requireSupabase();
    const id = newId();
    return withAudit(
      {
        area: ADMIN_AREAS.HOSTEL_RULES,
        action: 'rule.created',
        summary: `Added the "${input.name}" hostel allocation rule`,
        reference: id,
      },
      async () => {
        const row = unwrap<RuleRow>(
          await sb
            .from('hostel_allocation_rules')
            .insert({ id, ...toColumns(input), updated_at: nowIso() })
            .select('*')
            .single(),
        );
        return toRule(row);
      },
    );
  }

  async update(id: string, input: HostelAllocationRuleInput): Promise<HostelAllocationRule> {
    const sb = requireSupabase();
    return withAudit(
      {
        area: ADMIN_AREAS.HOSTEL_RULES,
        action: 'rule.updated',
        summary: `Updated the "${input.name}" hostel allocation rule`,
        reference: id,
      },
      async () => {
        const row = unwrap<RuleRow>(
          await sb
            .from('hostel_allocation_rules')
            .update({ ...toColumns(input), updated_at: nowIso() })
            .eq('id', id)
            .select('*')
            .single(),
        );
        return toRule(row);
      },
    );
  }

  async remove(id: string): Promise<void> {
    const sb = requireSupabase();
    const existing = toRule(
      unwrap<RuleRow>(await sb.from('hostel_allocation_rules').select('*').eq('id', id).single()),
    );
    await withAudit(
      {
        area: ADMIN_AREAS.HOSTEL_RULES,
        action: 'rule.deleted',
        summary: `Deleted the "${existing.name}" hostel allocation rule`,
        reference: id,
      },
      async () => {
        const { error } = await sb.from('hostel_allocation_rules').delete().eq('id', id);
        if (error) throw new Error(error.message);
      },
    );
  }
}
