/**
 * Scholarship window configuration shapes (SA.13; SRS F-01). Windows feed
 * the GSL Scholarship Management System; the student app pre-filters
 * listings by eligibility (academic standing from S027 NLEMS, programme,
 * year of study).
 * // SPEC: field and rule detail is not defined in the SRS; these shapes are
 * placeholders pending the Admin Portal requirements document.
 */

/** Programme codes from the SRS's appeals routing (B-05: LLB and LPT).
 * // SPEC: the authoritative programme list lives in S027. */
export const PROGRAMMES = ['LLB', 'LPT'] as const;
export type Programme = (typeof PROGRAMMES)[number];

/** // SPEC: the academic-standing scale is owned by S027 and not defined in
 * the SRS; placeholder values. */
export const ACADEMIC_STANDINGS = {
  ANY: 'any',
  SATISFACTORY: 'satisfactory',
  GOOD: 'good_standing',
} as const;
export type AcademicStanding = (typeof ACADEMIC_STANDINGS)[keyof typeof ACADEMIC_STANDINGS];

export const ACADEMIC_STANDING_LABELS: Record<AcademicStanding, string> = {
  [ACADEMIC_STANDINGS.ANY]: 'Any standing',
  [ACADEMIC_STANDINGS.SATISFACTORY]: 'Satisfactory or better',
  [ACADEMIC_STANDINGS.GOOD]: 'Good standing',
};

/** // SPEC: maximum year of study per programme is owned by S027. */
export const YEARS_OF_STUDY = [1, 2, 3, 4] as const;

export interface ScholarshipWindow {
  id: string;
  name: string;
  description: string;
  /** Minimum S027 academic standing the SA.13 pre-filter requires. */
  minStanding: AcademicStanding;
  programmes: Programme[];
  yearsOfStudy: number[];
  /** ISO date the application window opens (inclusive). */
  opensAt: string;
  /** ISO date the application window closes (inclusive). */
  closesAt: string;
  updatedAt: string;
}

export type ScholarshipWindowInput = Omit<ScholarshipWindow, 'id' | 'updatedAt'>;

export type WindowStatus = 'scheduled' | 'open' | 'closed';

/** Derive a window's lifecycle state from its open/close dates. */
export function scholarshipWindowStatus(window: ScholarshipWindow): WindowStatus {
  const now = Date.now();
  if (now < Date.parse(window.opensAt)) return 'scheduled';
  if (now <= Date.parse(window.closesAt)) return 'open';
  return 'closed';
}
