/**
 * Hostel/hall allocation-rule shapes (SA.10; SRS D-01). Rules feed the GSL
 * Hostel Management System (S120 or equivalent), which performs the actual
 * allocation; this portal never sees individual assignments.
 * // SPEC: the rule schema is not defined in the SRS; placeholder pending
 * the Admin Portal requirements document.
 */

/** // SPEC: applicant groupings are owned by S120/S027. */
export const APPLICANT_GROUPS = {
  FIRST_YEAR: 'first-year',
  CONTINUING: 'continuing',
  ALL: 'all',
} as const;
export type ApplicantGroup = (typeof APPLICANT_GROUPS)[keyof typeof APPLICANT_GROUPS];

export const APPLICANT_GROUP_LABELS: Record<ApplicantGroup, string> = {
  [APPLICANT_GROUPS.FIRST_YEAR]: 'First-year students',
  [APPLICANT_GROUPS.CONTINUING]: 'Continuing students',
  [APPLICANT_GROUPS.ALL]: 'All students',
};

/** // SPEC: allocation strategies are owned by S120. */
export const ALLOCATION_STRATEGIES = {
  BALLOT: 'random-ballot',
  FIRST_COME: 'first-come-first-served',
  NEED_BASED: 'need-based',
  MERIT_BASED: 'merit-based',
} as const;
export type AllocationStrategy = (typeof ALLOCATION_STRATEGIES)[keyof typeof ALLOCATION_STRATEGIES];

export const ALLOCATION_STRATEGY_LABELS: Record<AllocationStrategy, string> = {
  [ALLOCATION_STRATEGIES.BALLOT]: 'Random ballot',
  [ALLOCATION_STRATEGIES.FIRST_COME]: 'First come, first served',
  [ALLOCATION_STRATEGIES.NEED_BASED]: 'Need based',
  [ALLOCATION_STRATEGIES.MERIT_BASED]: 'Merit based',
};

export interface HostelAllocationRule {
  id: string;
  name: string;
  description: string;
  /** Order S120 evaluates rules in; 1 runs first. */
  priority: number;
  appliesTo: ApplicantGroup;
  strategy: AllocationStrategy;
  /** Share of available rooms this rule may allocate, in percent. */
  reservedSharePercent: number;
  active: boolean;
  updatedAt: string;
}

export type HostelAllocationRuleInput = Omit<HostelAllocationRule, 'id' | 'updatedAt'>;
