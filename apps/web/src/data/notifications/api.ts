import { createService } from '@starter/api-client';

import { notificationsEndpoints } from '@/api/notifications';
import { api } from '@/config/api';
import type {
  CategoryInput,
  NotificationCategory,
  NotificationTemplate,
  TemplateInput,
} from '@/types/notifications';

import type { NotificationsRepository } from './repository';

/**
 * Api stub routing through the base's gateway client.
 * // TODO(integration): S025 Communications + Push Notification Service; the
 * backend records the S003 audit entries for these writes (§5.1), so this
 * stub does not call the frontend audit seam.
 */
export class ApiNotificationsRepository implements NotificationsRepository {
  private readonly listCategoriesService = createService(
    notificationsEndpoints.listCategories,
    api,
  );
  private readonly createCategoryService = createService(
    notificationsEndpoints.createCategory,
    api,
  );
  private readonly updateCategoryService = createService(
    notificationsEndpoints.updateCategory,
    api,
  );
  private readonly deleteCategoryService = createService(
    notificationsEndpoints.deleteCategory,
    api,
  );
  private readonly listTemplatesService = createService(notificationsEndpoints.listTemplates, api);
  private readonly createTemplateService = createService(
    notificationsEndpoints.createTemplate,
    api,
  );
  private readonly updateTemplateService = createService(
    notificationsEndpoints.updateTemplate,
    api,
  );
  private readonly deleteTemplateService = createService(
    notificationsEndpoints.deleteTemplate,
    api,
  );

  listCategories(): Promise<NotificationCategory[]> {
    return this.listCategoriesService();
  }

  createCategory(input: CategoryInput): Promise<NotificationCategory> {
    return this.createCategoryService({ body: input });
  }

  updateCategory(id: string, input: CategoryInput): Promise<NotificationCategory> {
    return this.updateCategoryService({ params: { id }, body: input });
  }

  async deleteCategory(id: string): Promise<void> {
    await this.deleteCategoryService({ params: { id } });
  }

  listTemplates(): Promise<NotificationTemplate[]> {
    return this.listTemplatesService();
  }

  createTemplate(input: TemplateInput): Promise<NotificationTemplate> {
    return this.createTemplateService({ body: input });
  }

  updateTemplate(id: string, input: TemplateInput): Promise<NotificationTemplate> {
    return this.updateTemplateService({ params: { id }, body: input });
  }

  async deleteTemplate(id: string): Promise<void> {
    await this.deleteTemplateService({ params: { id } });
  }
}
