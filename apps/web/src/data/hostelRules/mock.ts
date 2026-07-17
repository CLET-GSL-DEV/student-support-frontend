import { ADMIN_AREAS } from '@/constants/admin';
import { withAudit } from '@/data/audit';
import { guardMockWrite, newId, nowIso, resolveScenario } from '@/data/support';
import {
  ALLOCATION_STRATEGIES,
  APPLICANT_GROUPS,
  type HostelAllocationRule,
  type HostelAllocationRuleInput,
} from '@/types/hostelRules';

import type { HostelRulesRepository } from './repository';

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

const SEED_RULES: HostelAllocationRule[] = [
  {
    id: 'hostel-accessibility',
    name: 'Accessibility-need priority',
    description: 'Students with registered accessibility needs are placed before any ballot runs',
    priority: 1,
    appliesTo: APPLICANT_GROUPS.ALL,
    strategy: ALLOCATION_STRATEGIES.NEED_BASED,
    reservedSharePercent: 10,
    active: true,
    updatedAt: daysAgo(5),
  },
  {
    id: 'hostel-firstyear',
    name: 'First-year hall reservation',
    description: 'Reserved hall share so incoming students can be accommodated on campus',
    priority: 2,
    appliesTo: APPLICANT_GROUPS.FIRST_YEAR,
    strategy: ALLOCATION_STRATEGIES.BALLOT,
    reservedSharePercent: 60,
    active: true,
    updatedAt: daysAgo(5),
  },
  {
    id: 'hostel-continuing',
    name: 'Continuing students ballot',
    description: 'Remaining rooms balloted among continuing students',
    priority: 3,
    appliesTo: APPLICANT_GROUPS.CONTINUING,
    strategy: ALLOCATION_STRATEGIES.FIRST_COME,
    reservedSharePercent: 30,
    active: false,
    updatedAt: daysAgo(30),
  },
];

export class MockHostelRulesRepository implements HostelRulesRepository {
  private rules: HostelAllocationRule[] = [...SEED_RULES];

  async list(): Promise<HostelAllocationRule[]> {
    const rules = await resolveScenario(this.rules, []);
    return [...rules].sort((a, b) => a.priority - b.priority);
  }

  async create(input: HostelAllocationRuleInput): Promise<HostelAllocationRule> {
    await guardMockWrite();
    const created: HostelAllocationRule = { ...input, id: newId(), updatedAt: nowIso() };
    return withAudit(
      {
        area: ADMIN_AREAS.HOSTEL_RULES,
        action: 'rule.created',
        summary: `Added the "${input.name}" hostel allocation rule`,
        reference: created.id,
      },
      async () => {
        this.rules = [...this.rules, created];
        return created;
      },
    );
  }

  async update(id: string, input: HostelAllocationRuleInput): Promise<HostelAllocationRule> {
    await guardMockWrite();
    const existing = this.rules.find((rule) => rule.id === id);
    if (!existing) throw new Error('Hostel allocation rule not found.');
    const updated: HostelAllocationRule = { ...existing, ...input, updatedAt: nowIso() };
    return withAudit(
      {
        area: ADMIN_AREAS.HOSTEL_RULES,
        action: 'rule.updated',
        summary: `Updated the "${updated.name}" hostel allocation rule`,
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
    if (!existing) throw new Error('Hostel allocation rule not found.');
    return withAudit(
      {
        area: ADMIN_AREAS.HOSTEL_RULES,
        action: 'rule.deleted',
        summary: `Deleted the "${existing.name}" hostel allocation rule`,
        reference: id,
      },
      async () => {
        this.rules = this.rules.filter((rule) => rule.id !== id);
      },
    );
  }
}
