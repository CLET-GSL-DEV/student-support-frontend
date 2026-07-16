/**
 * Welfare self-referral routing-rule shapes (SA.12; SRS E-01). Routing
 * configuration ONLY: nothing here may ever reference a welfare case, a
 * message, a case status, or any student-identifiable data. Case content
 * stays inside S031, enforced at the S026 response-schema level (CON-I2).
 * // SPEC: the rule schema is not defined in the SRS; placeholder pending
 * the Admin Portal requirements document.
 */

/** // SPEC: referral categories are owned by S031; placeholder list. */
export const REFERRAL_CATEGORIES = [
  'counselling',
  'safety',
  'financial-hardship',
  'accommodation',
  'other',
] as const;
export type ReferralCategory = (typeof REFERRAL_CATEGORIES)[number];

export const REFERRAL_CATEGORY_LABELS: Record<ReferralCategory, string> = {
  counselling: 'Counselling',
  safety: 'Safety',
  'financial-hardship': 'Financial Hardship',
  accommodation: 'Accommodation',
  other: 'Other',
};

export const ROUTING_PRIORITIES = {
  STANDARD: 'standard',
  CRISIS: 'crisis',
} as const;
export type RoutingPriority = (typeof ROUTING_PRIORITIES)[keyof typeof ROUTING_PRIORITIES];

export interface WelfareRoutingRule {
  id: string;
  category: ReferralCategory;
  /** Team or queue new self-referrals in this category route to; always an
   * organisational unit, never an individual student. */
  routeTo: string;
  /** Where an unacknowledged referral escalates. */
  escalateTo: string;
  /** Hours before an unacknowledged referral escalates. */
  escalateAfterHours: number;
  /** Crisis routes bypass the queue for the always-available crisis pathway
   * (A-04, E-01). */
  priority: RoutingPriority;
  active: boolean;
  updatedAt: string;
}

export type WelfareRoutingRuleInput = Omit<WelfareRoutingRule, 'id' | 'updatedAt'>;
