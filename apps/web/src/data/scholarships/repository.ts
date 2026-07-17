import type { ScholarshipWindow, ScholarshipWindowInput } from '@/types/scholarships';

/**
 * Scholarship window configuration (SA.13, F-01). Every write records to
 * the S003 audit seam (SRS §5.1).
 */
export interface ScholarshipsRepository {
  list(): Promise<ScholarshipWindow[]>;
  create(input: ScholarshipWindowInput): Promise<ScholarshipWindow>;
  update(id: string, input: ScholarshipWindowInput): Promise<ScholarshipWindow>;
  remove(id: string): Promise<void>;
}
