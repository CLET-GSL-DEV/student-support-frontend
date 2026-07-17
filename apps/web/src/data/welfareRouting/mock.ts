import { ADMIN_AREAS } from '@/constants/admin';
import { withAudit } from '@/data/audit';
import { guardMockWrite, newId, nowIso, resolveScenario } from '@/data/support';
import {
  ROUTING_PRIORITIES,
  type WelfareRoutingRule,
  type WelfareRoutingRuleInput,
} from '@/types/welfareRouting';

import type { WelfareRoutingRepository } from './repository';

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

/** Routing targets are organisational units only; nothing here identifies a
 * student or a case (CON-I2). */
const SEED_RULES: WelfareRoutingRule[] = [
  {
    id: 'route-safety',
    category: 'safety',
    routeTo: 'On-Call Welfare Responder',
    escalateTo: 'GSL Registrar',
    escalateAfterHours: 2,
    priority: ROUTING_PRIORITIES.CRISIS,
    active: true,
    updatedAt: daysAgo(3),
  },
  {
    id: 'route-counselling',
    category: 'counselling',
    routeTo: 'Student Counselling Unit',
    escalateTo: 'Dean of Students Office',
    escalateAfterHours: 48,
    priority: ROUTING_PRIORITIES.STANDARD,
    active: true,
    updatedAt: daysAgo(3),
  },
  {
    id: 'route-financial',
    category: 'financial-hardship',
    routeTo: 'Student Support Office',
    escalateTo: 'Dean of Students Office',
    escalateAfterHours: 72,
    priority: ROUTING_PRIORITIES.STANDARD,
    active: true,
    updatedAt: daysAgo(20),
  },
  {
    id: 'route-accommodation',
    category: 'accommodation',
    routeTo: 'Hostel Welfare Desk',
    escalateTo: 'Student Support Office',
    escalateAfterHours: 72,
    priority: ROUTING_PRIORITIES.STANDARD,
    active: false,
    updatedAt: daysAgo(40),
  },
];

export class MockWelfareRoutingRepository implements WelfareRoutingRepository {
  private rules: WelfareRoutingRule[] = [...SEED_RULES];

  list(): Promise<WelfareRoutingRule[]> {
    return resolveScenario(this.rules, []);
  }

  async create(input: WelfareRoutingRuleInput): Promise<WelfareRoutingRule> {
    await guardMockWrite();
    const created: WelfareRoutingRule = { ...input, id: newId(), updatedAt: nowIso() };
    return withAudit(
      {
        area: ADMIN_AREAS.WELFARE_ROUTING,
        action: 'rule.created',
        summary: `Added a welfare routing rule to "${input.routeTo}"`,
        reference: created.id,
      },
      async () => {
        this.rules = [...this.rules, created];
        return created;
      },
    );
  }

  async update(id: string, input: WelfareRoutingRuleInput): Promise<WelfareRoutingRule> {
    await guardMockWrite();
    const existing = this.rules.find((rule) => rule.id === id);
    if (!existing) throw new Error('Welfare routing rule not found.');
    const updated: WelfareRoutingRule = { ...existing, ...input, updatedAt: nowIso() };
    return withAudit(
      {
        area: ADMIN_AREAS.WELFARE_ROUTING,
        action: 'rule.updated',
        summary: `Updated the welfare routing rule for "${updated.routeTo}"`,
        reference: id,
      },
      async () => {
        this.rules = this.rules.map((rule) => (rule.id === id ? updated : rule));
        return updated;
      },
    );
  }

  async remove(id: string): Promise<void> {
    await guardMockWrite();
    const existing = this.rules.find((rule) => rule.id === id);
    if (!existing) throw new Error('Welfare routing rule not found.');
    return withAudit(
      {
        area: ADMIN_AREAS.WELFARE_ROUTING,
        action: 'rule.deleted',
        summary: `Deleted the welfare routing rule for "${existing.routeTo}"`,
        reference: id,
      },
      async () => {
        this.rules = this.rules.filter((rule) => rule.id !== id);
      },
    );
  }
}
