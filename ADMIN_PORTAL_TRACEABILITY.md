# Admin Portal Traceability (S028 SRS v1.0)

Frontend-only delivery status for the GSL Student Support Administrator portal, built in `apps/web`.
Every backend path sits behind a repository interface with a mock implementation (default) and an
Api stub routing through the S026 gateway client; flip `VITE_ADMIN_DATA_SOURCE` to `api` per domain
as real contracts land.

## Responsibility to screen map

| Admin responsibility (SRS)                                           | Screen / route          | Key files                                                                                                                 | Integration seam                           | Status                          |
| -------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------- |
| Notification content + statutory categories (§2.3, §2.6, G-01, G-02) | `/notifications`        | `features/notifications/*`, `data/notifications/*`, `api/notifications.ts`, `types/notifications.ts`                      | S025 Communications + Push (TODO)          | Built, mock data                |
| Scholarship windows + eligibility (§2.3, F-01)                       | `/scholarships`         | `features/scholarships/*`, `data/scholarships/*`, `api/scholarships.ts`, `types/scholarships.ts`                          | GSL Scholarship Management System (TODO)   | Built, mock data                |
| Welfare routing rules, config only (§2.3, §2.6, E-01)                | `/welfare-routing`      | `features/welfare-routing/*`, `data/welfareRouting/*`, `api/welfareRouting.ts`, `types/welfareRouting.ts`                 | S031 Welfare CMS (TODO)                    | Built, mock data                |
| Hostel allocation rules (§2.3, D-01)                                 | `/hostel-rules`         | `features/hostel-rules/*`, `data/hostelRules/*`, `api/hostelRules.ts`, `types/hostelRules.ts`                             | GSL Hostel MS, S120 or equivalent (TODO)   | Built, mock data                |
| SA.01 admissions status workflow (§2.3, B-01, §2.4)                  | `/admissions-workflow`  | `features/admissions-workflow/*`, `data/admissionsWorkflow/*`, `api/admissionsWorkflow.ts`, `types/admissionsWorkflow.ts` | S027 NLEMS (TODO)                          | Built, presentation-only edits  |
| Aggregate usage analytics (§2.3, §2.6)                               | `/dashboard`            | `features/dashboard/*`, `data/analytics/*`, `api/analytics.ts`, `types/analytics.ts`                                      | Analytics source unnamed in SRS (TODO)     | Built, placeholder aggregates   |
| S003 audit of all config changes (§1.2, §5.1)                        | `/audit-log`            | `features/audit-log/*`, `data/audit/*`, `api/audit.ts`, `types/audit.ts`                                                  | S003 Audit (TODO)                          | Built; seam enforced on writes  |
| App-store release governance (§1.2, §2.2, CON-G1, CON-L1)            | `/releases`             | `features/releases/*`, `data/releases/*`, `api/releases.ts`, `types/releases.ts`                                          | DTI release pipeline + S001 step-up (TODO) | Built; WCAG gate + DG step-up   |
| Portal landing (editable quick actions, aggregate summary and views) | `/dashboard`            | `features/dashboard/*`, `constants/adminNav.ts`, `stores/quickActions/*`                                                  | Reads the analytics seam                   | Built                           |
| Authentication / SSO / step-up base (§2.3, CON-G1)                   | `/login` + StepUpDialog | `@starter/auth` (pre-existing), `components/step-up/*`, `stores/stepUp/*`                                                 | S001 IAM (auth done; TOTP verify TODO)     | Auth pre-existing; step-up mock |

## Non-negotiables verified

- **No individual student data**: no repository, type, or seed carries a student identity; welfare
  is routing-rules-only (CON-I2), analytics are counts only, audit actors are staff.
- **Audit everything**: every mock write goes through `withAudit` (`data/audit/index.ts`), making
  the write-then-audit pairing structural; Api stubs delegate audit recording to the backend.
- **Step-up MFA**: release approval (the CON-G1 governance action) runs behind `useStepUp().guard`
  with a TOTP dialog; the elevation window is in-memory only.
- **Least-privilege**: `ProtectedRoute` gates the app by role; every area page additionally wraps in
  `CapabilityGate` over the `ROLE_CAPABILITIES` model (`constants/admin.ts`). The aggregate
  analytics views live on the dashboard landing behind the app-level role gate.
- **States**: every data surface handles loading (component `loading` props / `PageSkeleton`), error
  (`QueryErrorNotice` with retry), and empty (`emptyText` / info notices). The shared
  unsaved-changes pattern (`useUnsavedChanges` + `UnsavedChangesDialog`) exists for full-page forms;
  current editing is modal-scoped (dirty-close confirmation is a SPEC gap below).
- **Accessibility**: composed entirely from the WCAG-audited design system; custom compositions
  carry `aria-label`s and `aria-hidden` decorative icons.

## // SPEC gaps (need the Admin Portal requirements document)

| #   | Gap                                                                                                                                 | Where                                                                                    |
| --- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 1   | Role-to-capability matrix (single admin role holds everything, incl. `releases:approve` which belongs to the CLET DG persona)       | `constants/admin.ts`                                                                     |
| 2   | Step-up window length (5 min placeholder)                                                                                           | `stores/stepUp/useStepUpStore.ts`                                                        |
| 3   | S003 audit event field shape + failure semantics for config writes                                                                  | `types/audit.ts`, `data/audit/mock.ts`                                                   |
| 4   | Dashboard/analytics metric set (all aggregates are placeholders)                                                                    | `types/analytics.ts`, `data/analytics/mock.ts`, `features/dashboard/components/*`        |
| 5   | Notification template/category field detail (variables, localisation); fee reminders statutory-or-not (G-02 internal inconsistency) | `types/notifications.ts`, `features/notifications/forms/*`, `data/notifications/mock.ts` |
| 6   | Scholarship eligibility detail: programme list, academic-standing scale, max years (all S027-owned)                                 | `types/scholarships.ts`, `features/scholarships/forms/window-form.ts`                    |
| 7   | Welfare routing rule schema and referral category list (S031-owned)                                                                 | `types/welfareRouting.ts`, `features/welfare-routing/forms/rule-form.ts`                 |
| 8   | Hostel allocation rule schema: applicant groups, strategies (S120-owned)                                                            | `types/hostelRules.ts`, `features/hostel-rules/forms/rule-form.ts`                       |
| 9   | Whether the admin may add/remove workflow stages; B-01 "Admitted" vs "Enrolled" terminal-state inconsistency (Enrolled used)        | `types/admissionsWorkflow.ts`, `data/admissionsWorkflow/mock.ts`                         |
| 10  | Release workflow detail (states beyond the governance gates); release metadata fields; DG approver identity source                  | `types/releases.ts`, `features/releases/forms/release-form.ts`, `data/releases/mock.ts`  |
| 11  | Modal dirty-close confirmation (route-level unsaved guard exists; modal-scoped forms close without warning)                         | `hooks/useUnsavedChanges.ts`, all form modals                                            |

## // TODO(integration) seams

| System                                      | Seam files                                                                                     |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| S001 IAM (TOTP step-up verify)              | `components/step-up/StepUpDialog.tsx`, `data/releases/api.ts`                                  |
| S003 Audit                                  | `api/audit.ts`, `data/audit/{api,index}.ts`, `features/audit-log/components/AuditLogTable.tsx` |
| S025 Communications + Push                  | `api/notifications.ts`, `data/notifications/api.ts`                                            |
| S027 NLEMS (SA.01 workflow)                 | `api/admissionsWorkflow.ts`, `data/admissionsWorkflow/api.ts`                                  |
| S031 Welfare CMS (routing config only)      | `api/welfareRouting.ts`, `data/welfareRouting/api.ts`                                          |
| GSL Scholarship Management System           | `api/scholarships.ts`, `data/scholarships/api.ts`                                              |
| GSL Hostel MS (S120 or equivalent)          | `api/hostelRules.ts`, `data/hostelRules/api.ts`                                                |
| Aggregate analytics source (unnamed in SRS) | `api/analytics.ts`, `data/analytics/api.ts`                                                    |
| App Store / Play Store pipeline (DTI)       | `api/releases.ts`, `data/releases/api.ts`                                                      |
| Data-source flip switch                     | `data/dataSource.ts` (`VITE_ADMIN_DATA_SOURCE`)                                                |

## Verification evidence (2026-07-16)

`pnpm typecheck` (8/8), `pnpm lint` (7/7), `pnpm test` (16 tests, 5 files, all passing),
`pnpm build` (production build clean). Mock scenarios (`populated` / `empty` / `error`, via
`VITE_ADMIN_MOCK_SCENARIO` or the mock-scenario store) exercise every screen's loading, empty, and
error states without a backend.
