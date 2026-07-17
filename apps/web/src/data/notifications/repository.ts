import type {
  CategoryInput,
  NotificationCategory,
  NotificationTemplate,
  TemplateInput,
} from '@/types/notifications';

/**
 * Notification content configuration (SA.08 feeding S025 + Push). Every
 * write records to the S003 audit seam (SRS §5.1); implementations bake the
 * pairing in via withAudit.
 */
export interface NotificationsRepository {
  listCategories(): Promise<NotificationCategory[]>;
  createCategory(input: CategoryInput): Promise<NotificationCategory>;
  updateCategory(id: string, input: CategoryInput): Promise<NotificationCategory>;
  deleteCategory(id: string): Promise<void>;
  listTemplates(): Promise<NotificationTemplate[]>;
  createTemplate(input: TemplateInput): Promise<NotificationTemplate>;
  updateTemplate(id: string, input: TemplateInput): Promise<NotificationTemplate>;
  deleteTemplate(id: string): Promise<void>;
}
