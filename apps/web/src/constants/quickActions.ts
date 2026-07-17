import {
  BellRing,
  Building2,
  GraduationCap,
  HeartHandshake,
  type LucideIcon,
  Rocket,
  ScrollText,
  Tags,
  Workflow,
} from 'lucide-react';

import { ADMIN_AREAS, type AdminArea } from '@/constants/admin';
import { ROUTES } from '@/constants/routes';

export interface QuickActionDef {
  id: string;
  /** Task-level label, e.g. "Add notification template". */
  label: string;
  icon: LucideIcon;
  area: AdminArea;
  route: ROUTES;
  /** Query string that makes the target screen perform the action on
   * arrival (each screen consumes its `new` param via useCreateParam). */
  search?: string;
}

/**
 * The dashboard quick-action catalog: specific tasks, not area links.
 * Create-style actions deep-link into the target screen's create modal;
 * read-only areas expose their primary task as navigation.
 */
export const QUICK_ACTIONS: readonly QuickActionDef[] = [
  {
    id: 'notifications.add-template',
    label: 'Add notification template',
    icon: BellRing,
    area: ADMIN_AREAS.NOTIFICATIONS,
    route: ROUTES.NOTIFICATIONS,
    search: '?new=template',
  },
  {
    id: 'notifications.add-category',
    label: 'Add notification category',
    icon: Tags,
    area: ADMIN_AREAS.NOTIFICATIONS,
    route: ROUTES.NOTIFICATIONS,
    search: '?new=category',
  },
  {
    id: 'scholarships.add-window',
    label: 'Add scholarship',
    icon: GraduationCap,
    area: ADMIN_AREAS.SCHOLARSHIPS,
    route: ROUTES.SCHOLARSHIPS,
    search: '?new=window',
  },
  {
    id: 'welfare-routing.add-rule',
    label: 'Add routing rule',
    icon: HeartHandshake,
    area: ADMIN_AREAS.WELFARE_ROUTING,
    route: ROUTES.WELFARE_ROUTING,
    search: '?new=rule',
  },
  {
    id: 'hostel-rules.add-rule',
    label: 'Add allocation rule',
    icon: Building2,
    area: ADMIN_AREAS.HOSTEL_RULES,
    route: ROUTES.HOSTEL_RULES,
    search: '?new=rule',
  },
  {
    id: 'releases.prepare',
    label: 'Prepare release',
    icon: Rocket,
    area: ADMIN_AREAS.RELEASES,
    route: ROUTES.RELEASES,
    search: '?new=release',
  },
  {
    id: 'admissions-workflow.review',
    label: 'Review admissions stages',
    icon: Workflow,
    area: ADMIN_AREAS.ADMISSIONS_WORKFLOW,
    route: ROUTES.ADMISSIONS_WORKFLOW,
  },
  {
    id: 'audit.view',
    label: 'View audit log',
    icon: ScrollText,
    area: ADMIN_AREAS.AUDIT,
    route: ROUTES.AUDIT_LOG,
  },
];
