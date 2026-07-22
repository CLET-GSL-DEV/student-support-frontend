import { ADMIN_AREAS } from '@/constants/admin';
import { withAudit } from '@/data/audit';
import { requireSupabase } from '@/data/supabaseClient';
import { newId, nowIso, unwrap } from '@/data/supabaseSupport';
import type {
  ReferralCategory,
  RoutingPriority,
  WelfareRoutingRule,
  WelfareRoutingRuleInput,
} from '@/types/welfareRouting';

import type { WelfareRoutingRepository } from './repository';

interface RuleRow {
  id: string;
  category: ReferralCategory;
  route_to: string;
  escalate_to: string;
  escalate_after_hours: number;
  priority: RoutingPriority;
  active: boolean;
  updated_at: string;
}

const toRule = (row: RuleRow): WelfareRoutingRule => ({
  id: row.id,
  category: row.category,
  routeTo: row.route_to,
  escalateTo: row.escalate_to,
  escalateAfterHours: row.escalate_after_hours,
  priority: row.priority,
  active: row.active,
  updatedAt: row.updated_at,
});

const toColumns = (input: WelfareRoutingRuleInput) => ({
  category: input.category,
  route_to: input.routeTo,
  escalate_to: input.escalateTo,
  escalate_after_hours: input.escalateAfterHours,
  priority: input.priority,
  active: input.active,
});

/**
 * Supabase-backed welfare routing (SA.12): routing targets and escalation only,
 * never case data (CON-I2). Every write records to the S003 audit seam.
 */
export class SupabaseWelfareRoutingRepository implements WelfareRoutingRepository {
  async list(): Promise<WelfareRoutingRule[]> {
    const sb = requireSupabase();
    const rows = unwrap<RuleRow[]>(
      await sb.from('welfare_routing_rules').select('*').order('category'),
    );
    return rows.map(toRule);
  }

  async create(input: WelfareRoutingRuleInput): Promise<WelfareRoutingRule> {
    const sb = requireSupabase();
    const id = newId();
    return withAudit(
      {
        area: ADMIN_AREAS.WELFARE_ROUTING,
        action: 'rule.created',
        summary: `Added a welfare routing rule to "${input.routeTo}"`,
        reference: id,
      },
      async () => {
        const row = unwrap<RuleRow>(
          await sb
            .from('welfare_routing_rules')
            .insert({ id, ...toColumns(input), updated_at: nowIso() })
            .select('*')
            .single(),
        );
        return toRule(row);
      },
    );
  }

  async update(id: string, input: WelfareRoutingRuleInput): Promise<WelfareRoutingRule> {
    const sb = requireSupabase();
    return withAudit(
      {
        area: ADMIN_AREAS.WELFARE_ROUTING,
        action: 'rule.updated',
        summary: `Updated the welfare routing rule for "${input.routeTo}"`,
        reference: id,
      },
      async () => {
        const row = unwrap<RuleRow>(
          await sb
            .from('welfare_routing_rules')
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
      unwrap<RuleRow>(await sb.from('welfare_routing_rules').select('*').eq('id', id).single()),
    );
    await withAudit(
      {
        area: ADMIN_AREAS.WELFARE_ROUTING,
        action: 'rule.deleted',
        summary: `Deleted the welfare routing rule for "${existing.routeTo}"`,
        reference: id,
      },
      async () => {
        const { error } = await sb.from('welfare_routing_rules').delete().eq('id', id);
        if (error) throw new Error(error.message);
      },
    );
  }
}
