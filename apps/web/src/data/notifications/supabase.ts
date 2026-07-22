import { ADMIN_AREAS } from '@/constants/admin';
import { withAudit } from '@/data/audit';
import { requireSupabase } from '@/data/supabaseClient';
import { newId, nowIso, unwrap } from '@/data/supabaseSupport';
import type {
  CategoryInput,
  NotificationCategory,
  NotificationTemplate,
  TemplateInput,
} from '@/types/notifications';

import type { NotificationsRepository } from './repository';

interface CategoryRow {
  id: string;
  name: string;
  description: string;
  statutory: boolean;
  baseline: boolean;
  updated_at: string;
}

interface TemplateRow {
  id: string;
  category_id: string;
  name: string;
  push_title: string;
  push_body: string;
  inbox_body: string;
  updated_at: string;
}

const toCategory = (row: CategoryRow): NotificationCategory => ({
  id: row.id,
  name: row.name,
  description: row.description,
  statutory: row.statutory,
  baseline: row.baseline,
  updatedAt: row.updated_at,
});

const toTemplate = (row: TemplateRow): NotificationTemplate => ({
  id: row.id,
  categoryId: row.category_id,
  name: row.name,
  pushTitle: row.push_title,
  pushBody: row.push_body,
  inboxBody: row.inbox_body,
  updatedAt: row.updated_at,
});

/**
 * Supabase-backed notification content (SA.08). Preserves the G-02 baseline
 * locking rules the mock enforces; every write records to the S003 audit seam.
 */
export class SupabaseNotificationsRepository implements NotificationsRepository {
  async listCategories(): Promise<NotificationCategory[]> {
    const sb = requireSupabase();
    const rows = unwrap<CategoryRow[]>(
      await sb.from('notification_categories').select('*').order('name'),
    );
    return rows.map(toCategory);
  }

  async createCategory(input: CategoryInput): Promise<NotificationCategory> {
    const sb = requireSupabase();
    const id = newId();
    return withAudit(
      {
        area: ADMIN_AREAS.NOTIFICATIONS,
        action: 'category.created',
        summary: `Added notification category "${input.name}"`,
        reference: id,
      },
      async () => {
        const row = unwrap<CategoryRow>(
          await sb
            .from('notification_categories')
            .insert({
              id,
              name: input.name,
              description: input.description,
              statutory: input.statutory,
              baseline: false,
              updated_at: nowIso(),
            })
            .select('*')
            .single(),
        );
        return toCategory(row);
      },
    );
  }

  async updateCategory(id: string, input: CategoryInput): Promise<NotificationCategory> {
    const sb = requireSupabase();
    const existing = toCategory(
      unwrap<CategoryRow>(
        await sb.from('notification_categories').select('*').eq('id', id).single(),
      ),
    );
    if (existing.baseline && !input.statutory) {
      throw new Error('Statutory baseline categories cannot be made optional (G-02).');
    }
    return withAudit(
      {
        area: ADMIN_AREAS.NOTIFICATIONS,
        action: 'category.updated',
        summary: `Updated notification category "${input.name}"`,
        reference: id,
      },
      async () => {
        const row = unwrap<CategoryRow>(
          await sb
            .from('notification_categories')
            .update({
              name: input.name,
              description: input.description,
              statutory: input.statutory,
              updated_at: nowIso(),
            })
            .eq('id', id)
            .select('*')
            .single(),
        );
        return toCategory(row);
      },
    );
  }

  async deleteCategory(id: string): Promise<void> {
    const sb = requireSupabase();
    const existing = toCategory(
      unwrap<CategoryRow>(
        await sb.from('notification_categories').select('*').eq('id', id).single(),
      ),
    );
    if (existing.baseline) {
      throw new Error('Statutory baseline categories cannot be deleted (G-02).');
    }
    const templates = unwrap<{ id: string }[]>(
      await sb.from('notification_templates').select('id').eq('category_id', id),
    );
    if (templates.length > 0) {
      throw new Error('Reassign or delete the templates in this category first.');
    }
    await withAudit(
      {
        area: ADMIN_AREAS.NOTIFICATIONS,
        action: 'category.deleted',
        summary: `Deleted notification category "${existing.name}"`,
        reference: id,
      },
      async () => {
        const { error } = await sb.from('notification_categories').delete().eq('id', id);
        if (error) throw new Error(error.message);
      },
    );
  }

  async listTemplates(): Promise<NotificationTemplate[]> {
    const sb = requireSupabase();
    const rows = unwrap<TemplateRow[]>(
      await sb.from('notification_templates').select('*').order('name'),
    );
    return rows.map(toTemplate);
  }

  async createTemplate(input: TemplateInput): Promise<NotificationTemplate> {
    const sb = requireSupabase();
    const id = newId();
    return withAudit(
      {
        area: ADMIN_AREAS.NOTIFICATIONS,
        action: 'template.created',
        summary: `Added the "${input.name}" notification template`,
        reference: id,
      },
      async () => {
        const row = unwrap<TemplateRow>(
          await sb
            .from('notification_templates')
            .insert({
              id,
              category_id: input.categoryId,
              name: input.name,
              push_title: input.pushTitle,
              push_body: input.pushBody,
              inbox_body: input.inboxBody,
              updated_at: nowIso(),
            })
            .select('*')
            .single(),
        );
        return toTemplate(row);
      },
    );
  }

  async updateTemplate(id: string, input: TemplateInput): Promise<NotificationTemplate> {
    const sb = requireSupabase();
    return withAudit(
      {
        area: ADMIN_AREAS.NOTIFICATIONS,
        action: 'template.updated',
        summary: `Updated the "${input.name}" notification template`,
        reference: id,
      },
      async () => {
        const row = unwrap<TemplateRow>(
          await sb
            .from('notification_templates')
            .update({
              category_id: input.categoryId,
              name: input.name,
              push_title: input.pushTitle,
              push_body: input.pushBody,
              inbox_body: input.inboxBody,
              updated_at: nowIso(),
            })
            .eq('id', id)
            .select('*')
            .single(),
        );
        return toTemplate(row);
      },
    );
  }

  async deleteTemplate(id: string): Promise<void> {
    const sb = requireSupabase();
    const existing = toTemplate(
      unwrap<TemplateRow>(
        await sb.from('notification_templates').select('*').eq('id', id).single(),
      ),
    );
    await withAudit(
      {
        area: ADMIN_AREAS.NOTIFICATIONS,
        action: 'template.deleted',
        summary: `Deleted the "${existing.name}" notification template`,
        reference: id,
      },
      async () => {
        const { error } = await sb.from('notification_templates').delete().eq('id', id);
        if (error) throw new Error(error.message);
      },
    );
  }
}
