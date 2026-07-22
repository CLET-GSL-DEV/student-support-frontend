import { ADMIN_AREAS } from '@/constants/admin';
import { withAudit } from '@/data/audit';
import { requireSupabase } from '@/data/supabaseClient';
import { nowIso, unwrap } from '@/data/supabaseSupport';
import type { AdmissionsWorkflowStage, StagePresentationInput } from '@/types/admissionsWorkflow';

import type { AdmissionsWorkflowRepository } from './repository';

interface StageRow {
  id: string;
  staff_status_key: string;
  applicant_label: string;
  applicant_description: string;
  stage_order: number;
  notify_on_enter: boolean;
  terminal: boolean;
  rejection_branch: boolean;
  shows_appeal_rights: boolean;
  updated_at: string;
}

const toStage = (row: StageRow): AdmissionsWorkflowStage => ({
  id: row.id,
  staffStatusKey: row.staff_status_key,
  applicantLabel: row.applicant_label,
  applicantDescription: row.applicant_description,
  order: row.stage_order,
  notifyOnEnter: row.notify_on_enter,
  terminal: row.terminal,
  rejectionBranch: row.rejection_branch,
  showsAppealRights: row.shows_appeal_rights,
  updatedAt: row.updated_at,
});

/**
 * Supabase-backed admissions-workflow presentation (SA.01, B-01). The stage set
 * is S027-owned and read-only; only presentation fields are editable, and each
 * edit records to the S003 audit seam.
 */
export class SupabaseAdmissionsWorkflowRepository implements AdmissionsWorkflowRepository {
  async list(): Promise<AdmissionsWorkflowStage[]> {
    const sb = requireSupabase();
    const rows = unwrap<StageRow[]>(
      await sb.from('admissions_workflow_stages').select('*').order('stage_order'),
    );
    return rows.map(toStage);
  }

  async updateStage(id: string, input: StagePresentationInput): Promise<AdmissionsWorkflowStage> {
    const sb = requireSupabase();
    return withAudit(
      {
        area: ADMIN_AREAS.ADMISSIONS_WORKFLOW,
        action: 'stage.updated',
        summary: `Updated the "${input.applicantLabel}" admissions stage presentation`,
        reference: id,
      },
      async () => {
        const row = unwrap<StageRow>(
          await sb
            .from('admissions_workflow_stages')
            .update({
              applicant_label: input.applicantLabel,
              applicant_description: input.applicantDescription,
              notify_on_enter: input.notifyOnEnter,
              updated_at: nowIso(),
            })
            .eq('id', id)
            .select('*')
            .single(),
        );
        return toStage(row);
      },
    );
  }
}
