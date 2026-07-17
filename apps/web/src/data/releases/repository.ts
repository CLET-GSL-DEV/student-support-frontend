import type { AppRelease, AuditResultInput, ReleaseInput } from '@/types/releases';

/**
 * App-store release governance (SRS §1.2, §2.2, CON-G1, CON-L1). Every
 * transition records to the S003 audit seam (§5.1: release events are
 * logged). `approve` is the CLET DG action; the UI gates it behind TOTP
 * step-up, and implementations refuse it without a passed WCAG audit.
 */
export interface ReleasesRepository {
  list(): Promise<AppRelease[]>;
  create(input: ReleaseInput): Promise<AppRelease>;
  requestAudit(id: string): Promise<AppRelease>;
  recordAuditResult(id: string, input: AuditResultInput): Promise<AppRelease>;
  approve(id: string): Promise<AppRelease>;
  markSubmitted(id: string): Promise<AppRelease>;
}
