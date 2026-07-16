import { resolveRepository } from '@/data/dataSource';

import { ApiNotificationsRepository } from './api';
import { MockNotificationsRepository } from './mock';
import type { NotificationsRepository } from './repository';

export type { NotificationsRepository } from './repository';

/** The active notification-content repository (mock by default). */
export const notificationsRepository: NotificationsRepository =
  resolveRepository<NotificationsRepository>(
    new MockNotificationsRepository(),
    new ApiNotificationsRepository(),
  );
