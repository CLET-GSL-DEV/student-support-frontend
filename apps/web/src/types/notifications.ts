/**
 * Notification content configuration shapes (SA.08). The admin defines the
 * category list, which categories are statutory (G-02: cannot be opted out
 * of in the student app), and the content templates delivered through S025
 * and the Push Notification Service.
 * // SPEC: template and category field detail is not defined in the SRS;
 * these shapes are placeholders pending the Admin Portal requirements
 * document.
 */
export interface NotificationCategory {
  id: string;
  name: string;
  description: string;
  /** Statutory categories cannot be opted out of by students (G-02). */
  statutory: boolean;
  /** The four G-02 baseline categories (results, admission decisions, exam
   * notices, welfare safety alerts) ship locked: they cannot be deleted or
   * made optional. Admin-created categories are never baseline. */
  baseline: boolean;
  updatedAt: string;
}

export interface CategoryInput {
  name: string;
  description: string;
  statutory: boolean;
}

export interface NotificationTemplate {
  id: string;
  categoryId: string;
  name: string;
  /** Push notification title, visible on the lock screen. */
  pushTitle: string;
  /** Push notification body. Must contain no sensitive personal data
   * (NFR-PR2); welfare pushes say only that an update exists (G-03). */
  pushBody: string;
  /** Full message shown inside the authenticated SA.08 inbox. */
  inboxBody: string;
  updatedAt: string;
}

export interface TemplateInput {
  categoryId: string;
  name: string;
  pushTitle: string;
  pushBody: string;
  inboxBody: string;
}
