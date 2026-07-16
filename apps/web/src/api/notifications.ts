import { DELETE, GET, POST, PUT } from '@starter/api-client';

import type {
  CategoryInput,
  NotificationCategory,
  NotificationTemplate,
  TemplateInput,
} from '@/types/notifications';

/**
 * Notification content endpoint definitions, consumed only by the
 * ApiNotificationsRepository stub (src/data/notifications/api.ts).
 * // TODO(integration): S025 Communications + Push Notification Service;
 * paths and shapes are placeholders until the S025-facing admin contract is
 * published behind the S026 gateway.
 */
export const notificationsKeys = {
  all: ['notifications'] as const,
  categories: () => [...notificationsKeys.all, 'categories'] as const,
  templates: () => [...notificationsKeys.all, 'templates'] as const,
} as const;

export const notificationsEndpoints = {
  listCategories: GET<NotificationCategory[]>({
    path: '/admin/notification-categories',
    queryKey: notificationsKeys.categories(),
  }),
  createCategory: POST<NotificationCategory, CategoryInput>({
    path: '/admin/notification-categories',
    invalidates: [notificationsKeys.categories()],
  }),
  updateCategory: PUT<NotificationCategory, CategoryInput>({
    path: (params) => `/admin/notification-categories/${params.id}`,
    invalidates: [notificationsKeys.categories()],
  }),
  deleteCategory: DELETE({
    path: (params) => `/admin/notification-categories/${params.id}`,
    invalidates: [notificationsKeys.categories()],
  }),
  listTemplates: GET<NotificationTemplate[]>({
    path: '/admin/notification-templates',
    queryKey: notificationsKeys.templates(),
  }),
  createTemplate: POST<NotificationTemplate, TemplateInput>({
    path: '/admin/notification-templates',
    invalidates: [notificationsKeys.templates()],
  }),
  updateTemplate: PUT<NotificationTemplate, TemplateInput>({
    path: (params) => `/admin/notification-templates/${params.id}`,
    invalidates: [notificationsKeys.templates()],
  }),
  deleteTemplate: DELETE({
    path: (params) => `/admin/notification-templates/${params.id}`,
    invalidates: [notificationsKeys.templates()],
  }),
} as const;
