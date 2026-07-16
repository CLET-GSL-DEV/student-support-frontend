import { ADMIN_AREAS } from '@/constants/admin';
import { withAudit } from '@/data/audit';
import { guardMockWrite, newId, nowIso, resolveScenario } from '@/data/support';
import type {
  CategoryInput,
  NotificationCategory,
  NotificationTemplate,
  TemplateInput,
} from '@/types/notifications';

import type { NotificationsRepository } from './repository';

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * The G-02 statutory baseline (results, admission decisions, exam notices,
 * welfare safety alerts) plus the optional G-01 inbox categories. Baseline
 * rows are locked: no deletion, no opting down to non-statutory.
 * // SPEC: G-02's requirement text also names fee reminders as statutory
 * while its validation list does not; fees ship optional here pending the
 * Admin Portal requirements document.
 */
const SEED_CATEGORIES: NotificationCategory[] = [
  {
    id: 'cat-results',
    name: 'Results',
    description: 'Academic results publication notices',
    statutory: true,
    baseline: true,
    updatedAt: daysAgo(30),
  },
  {
    id: 'cat-admission-decisions',
    name: 'Admission Decisions',
    description: 'Admissions status changes and decisions (SA.01)',
    statutory: true,
    baseline: true,
    updatedAt: daysAgo(30),
  },
  {
    id: 'cat-exam-notices',
    name: 'Exam Notices',
    description: 'Examination schedules, venues, and notices',
    statutory: true,
    baseline: true,
    updatedAt: daysAgo(30),
  },
  {
    id: 'cat-welfare-safety',
    name: 'Welfare Safety Alerts',
    description: 'Safety-critical welfare alerts, content minimised (G-03)',
    statutory: true,
    baseline: true,
    updatedAt: daysAgo(30),
  },
  {
    id: 'cat-fees',
    name: 'Fees',
    description: 'Fee schedules, due dates, and payment reminders (C-03)',
    statutory: false,
    baseline: false,
    updatedAt: daysAgo(12),
  },
  {
    id: 'cat-library',
    name: 'Library',
    description: 'Due dates, reservations, and fines from S104',
    statutory: false,
    baseline: false,
    updatedAt: daysAgo(12),
  },
  {
    id: 'cat-hostel',
    name: 'Hostel',
    description: 'Hostel and hall notices',
    statutory: false,
    baseline: false,
    updatedAt: daysAgo(12),
  },
  {
    id: 'cat-scholarships',
    name: 'Scholarships',
    description: 'Scholarship windows, awards, and rejections (SA.13)',
    statutory: false,
    baseline: false,
    updatedAt: daysAgo(12),
  },
  {
    id: 'cat-society-events',
    name: 'Society Events',
    description: 'Co-curricular and society activity (SA.14)',
    statutory: false,
    baseline: false,
    updatedAt: daysAgo(12),
  },
];

/** Content-minimised per G-03/NFR-PR2: welfare pushes carry no case detail,
 * results pushes no grades, fee pushes no itemised breakdown. */
const SEED_TEMPLATES: NotificationTemplate[] = [
  {
    id: 'tpl-results',
    categoryId: 'cat-results',
    name: 'Results available',
    pushTitle: 'Results',
    pushBody: 'Your results are available',
    inboxBody: 'Your latest results have been published. Open Grades and Transcript to view them.',
    updatedAt: daysAgo(1),
  },
  {
    id: 'tpl-admission-decision',
    categoryId: 'cat-admission-decisions',
    name: 'Admission status update',
    pushTitle: 'Admissions',
    pushBody: 'There is an update on your application',
    inboxBody:
      'Your admission status has changed. Open Admissions Status for the decision and next steps.',
    updatedAt: daysAgo(4),
  },
  {
    id: 'tpl-exam-notice',
    categoryId: 'cat-exam-notices',
    name: 'Exam notice published',
    pushTitle: 'Exam notice',
    pushBody: 'A new examination notice has been published',
    inboxBody: 'A new examination notice affects your programme. Open Notifications for details.',
    updatedAt: daysAgo(6),
  },
  {
    id: 'tpl-welfare-update',
    categoryId: 'cat-welfare-safety',
    name: 'Welfare update',
    pushTitle: 'Welfare',
    pushBody: 'You have a welfare update',
    inboxBody: 'You have an update on your welfare case. Open Welfare to view it securely.',
    updatedAt: daysAgo(9),
  },
  {
    id: 'tpl-fee-reminder-7d',
    categoryId: 'cat-fees',
    name: 'Fee reminder (7 days)',
    pushTitle: 'Fees',
    pushBody: 'A fee payment is due in 7 days',
    inboxBody: 'A fee payment is due in 7 days. Open Fees and Payments to view your balance.',
    updatedAt: daysAgo(15),
  },
  {
    id: 'tpl-fee-reminder-1d',
    categoryId: 'cat-fees',
    name: 'Fee reminder (1 day)',
    pushTitle: 'Fees',
    pushBody: 'A fee payment is due tomorrow',
    inboxBody: 'A fee payment is due tomorrow. Open Fees and Payments to complete payment.',
    updatedAt: daysAgo(15),
  },
];

export class MockNotificationsRepository implements NotificationsRepository {
  private categories: NotificationCategory[] = [...SEED_CATEGORIES];
  private templates: NotificationTemplate[] = [...SEED_TEMPLATES];

  listCategories(): Promise<NotificationCategory[]> {
    return resolveScenario(this.categories, []);
  }

  async createCategory(input: CategoryInput): Promise<NotificationCategory> {
    await guardMockWrite();
    const created: NotificationCategory = {
      ...input,
      id: newId(),
      baseline: false,
      updatedAt: nowIso(),
    };
    return withAudit(
      {
        area: ADMIN_AREAS.NOTIFICATIONS,
        action: 'category.created',
        summary: `Added notification category "${input.name}"`,
        reference: created.id,
      },
      async () => {
        this.categories = [...this.categories, created];
        return created;
      },
    );
  }

  async updateCategory(id: string, input: CategoryInput): Promise<NotificationCategory> {
    await guardMockWrite();
    const existing = this.categories.find((category) => category.id === id);
    if (!existing) throw new Error('Notification category not found.');
    if (existing.baseline && !input.statutory) {
      throw new Error('Statutory baseline categories cannot be made optional (G-02).');
    }
    const updated: NotificationCategory = { ...existing, ...input, updatedAt: nowIso() };
    return withAudit(
      {
        area: ADMIN_AREAS.NOTIFICATIONS,
        action: 'category.updated',
        summary: `Updated notification category "${updated.name}"`,
        reference: id,
      },
      async () => {
        this.categories = this.categories.map((category) =>
          category.id === id ? updated : category,
        );
        return updated;
      },
    );
  }

  async deleteCategory(id: string): Promise<void> {
    await guardMockWrite();
    const existing = this.categories.find((category) => category.id === id);
    if (!existing) throw new Error('Notification category not found.');
    if (existing.baseline) {
      throw new Error('Statutory baseline categories cannot be deleted (G-02).');
    }
    if (this.templates.some((template) => template.categoryId === id)) {
      throw new Error('Reassign or delete the templates in this category first.');
    }
    return withAudit(
      {
        area: ADMIN_AREAS.NOTIFICATIONS,
        action: 'category.deleted',
        summary: `Deleted notification category "${existing.name}"`,
        reference: id,
      },
      async () => {
        this.categories = this.categories.filter((category) => category.id !== id);
      },
    );
  }

  listTemplates(): Promise<NotificationTemplate[]> {
    return resolveScenario(this.templates, []);
  }

  async createTemplate(input: TemplateInput): Promise<NotificationTemplate> {
    await guardMockWrite();
    const created: NotificationTemplate = { ...input, id: newId(), updatedAt: nowIso() };
    return withAudit(
      {
        area: ADMIN_AREAS.NOTIFICATIONS,
        action: 'template.created',
        summary: `Added the "${input.name}" notification template`,
        reference: created.id,
      },
      async () => {
        this.templates = [...this.templates, created];
        return created;
      },
    );
  }

  async updateTemplate(id: string, input: TemplateInput): Promise<NotificationTemplate> {
    await guardMockWrite();
    const existing = this.templates.find((template) => template.id === id);
    if (!existing) throw new Error('Notification template not found.');
    const updated: NotificationTemplate = { ...existing, ...input, updatedAt: nowIso() };
    return withAudit(
      {
        area: ADMIN_AREAS.NOTIFICATIONS,
        action: 'template.updated',
        summary: `Updated the "${updated.name}" notification template`,
        reference: id,
      },
      async () => {
        this.templates = this.templates.map((template) =>
          template.id === id ? updated : template,
        );
        return updated;
      },
    );
  }

  async deleteTemplate(id: string): Promise<void> {
    await guardMockWrite();
    const existing = this.templates.find((template) => template.id === id);
    if (!existing) throw new Error('Notification template not found.');
    return withAudit(
      {
        area: ADMIN_AREAS.NOTIFICATIONS,
        action: 'template.deleted',
        summary: `Deleted the "${existing.name}" notification template`,
        reference: id,
      },
      async () => {
        this.templates = this.templates.filter((template) => template.id !== id);
      },
    );
  }
}
