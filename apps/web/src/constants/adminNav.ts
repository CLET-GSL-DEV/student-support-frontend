import {
  Activity,
  BellRing,
  Building2,
  GraduationCap,
  HeartHandshake,
  type LucideIcon,
  Rocket,
  ScrollText,
  Workflow,
} from 'lucide-react';

import { ADMIN_AREAS, ADMIN_AREA_LABELS, type AdminArea } from '@/constants/admin';
import { ROUTES } from '@/constants/routes';

export interface AdminAreaNavItem {
  area: AdminArea;
  label: string;
  route: ROUTES;
  icon: LucideIcon;
  /** One-line blurb for the dashboard entry-point card. */
  description: string;
}

/**
 * Single ordered source for the sidebar nav and the dashboard entry-point
 * grid, keyed to the SRS §2.3 configuration areas.
 */
export const ADMIN_AREA_NAV: readonly AdminAreaNavItem[] = [
  {
    area: ADMIN_AREAS.NOTIFICATIONS,
    label: ADMIN_AREA_LABELS[ADMIN_AREAS.NOTIFICATIONS],
    route: ROUTES.NOTIFICATIONS,
    icon: BellRing,
    description: 'Templates and statutory categories for SA.08 delivery via S025',
  },
  {
    area: ADMIN_AREAS.SCHOLARSHIPS,
    label: ADMIN_AREA_LABELS[ADMIN_AREAS.SCHOLARSHIPS],
    route: ROUTES.SCHOLARSHIPS,
    icon: GraduationCap,
    description: 'Listings, eligibility parameters, and application windows for SA.13',
  },
  {
    area: ADMIN_AREAS.WELFARE_ROUTING,
    label: ADMIN_AREA_LABELS[ADMIN_AREAS.WELFARE_ROUTING],
    route: ROUTES.WELFARE_ROUTING,
    icon: HeartHandshake,
    description: 'Routing targets and escalation for SA.12 self-referrals, rules only',
  },
  {
    area: ADMIN_AREAS.HOSTEL_RULES,
    label: ADMIN_AREA_LABELS[ADMIN_AREAS.HOSTEL_RULES],
    route: ROUTES.HOSTEL_RULES,
    icon: Building2,
    description: 'Allocation rules for halls and hostels, feeding the GSL Hostel MS',
  },
  {
    area: ADMIN_AREAS.ADMISSIONS_WORKFLOW,
    label: ADMIN_AREA_LABELS[ADMIN_AREAS.ADMISSIONS_WORKFLOW],
    route: ROUTES.ADMISSIONS_WORKFLOW,
    icon: Workflow,
    description: 'Applicant-facing SA.01 status workflow shown during admissions',
  },
  {
    area: ADMIN_AREAS.ANALYTICS,
    label: ADMIN_AREA_LABELS[ADMIN_AREAS.ANALYTICS],
    route: ROUTES.ANALYTICS,
    icon: Activity,
    description: 'Aggregate usage across the student app, no individual data',
  },
  {
    area: ADMIN_AREAS.AUDIT,
    label: ADMIN_AREA_LABELS[ADMIN_AREAS.AUDIT],
    route: ROUTES.AUDIT_LOG,
    icon: ScrollText,
    description: 'Configuration change history and release events from S003',
  },
  {
    area: ADMIN_AREAS.RELEASES,
    label: ADMIN_AREA_LABELS[ADMIN_AREAS.RELEASES],
    route: ROUTES.RELEASES,
    icon: Rocket,
    description: 'WCAG audit gating and DG approval for app store releases',
  },
];

/** The five §2.3 configuration areas, in nav order. */
export const CONFIG_AREA_NAV = ADMIN_AREA_NAV.filter((item) =>
  (
    [
      ADMIN_AREAS.NOTIFICATIONS,
      ADMIN_AREAS.SCHOLARSHIPS,
      ADMIN_AREAS.WELFARE_ROUTING,
      ADMIN_AREAS.HOSTEL_RULES,
      ADMIN_AREAS.ADMISSIONS_WORKFLOW,
    ] as AdminArea[]
  ).includes(item.area),
);

/** Insight and governance surfaces (analytics, audit, releases). */
export const OVERSIGHT_AREA_NAV = ADMIN_AREA_NAV.filter((item) => !CONFIG_AREA_NAV.includes(item));
