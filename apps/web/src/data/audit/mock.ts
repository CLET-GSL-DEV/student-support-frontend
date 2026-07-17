import { useSessionStore } from '@starter/auth';

import { ADMIN_AREAS } from '@/constants/admin';
import { mockDelay, newId, nowIso, resolveScenario } from '@/data/support';
import type { AuditEvent, AuditListQuery, NewAuditEvent } from '@/types/audit';

import type { AuditRepository } from './repository';

/** Fallback actor label when the IAM `/me` profile has not resolved. Never a
 * student identity; this portal has no student data surface (§2.3). */
const DEFAULT_ACTOR = 'GSL Student Support Administrator';

function currentActor(): string {
  return useSessionStore.getState().user?.displayName ?? DEFAULT_ACTOR;
}

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

/** Dummy history so the dashboard feed and audit screen render meaningfully
 * under the 'populated' scenario. */
const SEED_AUDIT_EVENTS: AuditEvent[] = [
  {
    id: newId(),
    occurredAt: daysAgo(1),
    actor: DEFAULT_ACTOR,
    area: ADMIN_AREAS.NOTIFICATIONS,
    action: 'template.updated',
    summary: 'Updated the Results notification template',
    reference: 'tpl-results',
  },
  {
    id: newId(),
    occurredAt: daysAgo(2),
    actor: DEFAULT_ACTOR,
    area: ADMIN_AREAS.SCHOLARSHIPS,
    action: 'window.opened',
    summary: 'Opened the GSL Merit Scholarship application window',
    reference: 'sch-merit',
  },
  {
    id: newId(),
    occurredAt: daysAgo(3),
    actor: DEFAULT_ACTOR,
    area: ADMIN_AREAS.WELFARE_ROUTING,
    action: 'rule.updated',
    summary: 'Changed the escalation target for counselling referrals',
    reference: 'route-counselling',
  },
  {
    id: newId(),
    occurredAt: daysAgo(5),
    actor: DEFAULT_ACTOR,
    area: ADMIN_AREAS.HOSTEL_RULES,
    action: 'rule.created',
    summary: 'Added a first-year priority rule for hall allocation',
    reference: 'hostel-firstyear',
  },
  {
    id: newId(),
    occurredAt: daysAgo(8),
    actor: DEFAULT_ACTOR,
    area: ADMIN_AREAS.RELEASES,
    action: 'release.submitted',
    summary: 'Submitted app release 1.4.0 for WCAG audit',
    reference: 'rel-1.4.0',
  },
];

/**
 * In-memory S003 stand-in, and the reference mock-repository implementation
 * for the pattern every domain follows. Reads honour the mock scenario;
 * writes always succeed so the audit trail itself never blocks a
 * configuration change under test (// SPEC: real S003 failure semantics for
 * config writes are undefined in the SRS).
 */
export class MockAuditRepository implements AuditRepository {
  private events: AuditEvent[] = [...SEED_AUDIT_EVENTS];

  async list(query?: AuditListQuery): Promise<AuditEvent[]> {
    const events = await resolveScenario(this.events, []);
    return events
      .filter((event) => {
        if (query?.area && event.area !== query.area) return false;
        if (query?.from && event.occurredAt < query.from) return false;
        if (query?.to && event.occurredAt > query.to) return false;
        return true;
      })
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  }

  async record(event: NewAuditEvent): Promise<AuditEvent> {
    await mockDelay();
    const created: AuditEvent = {
      ...event,
      id: newId(),
      occurredAt: nowIso(),
      actor: currentActor(),
    };
    this.events = [created, ...this.events];
    return created;
  }
}
