import { useState } from 'react';

import { Badge, Button, Card, Notice, useToast } from '@rfdtech/components';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, BellRing, Pencil } from 'lucide-react';

import { PageSkeleton } from '@starter/ui';

import { admissionsWorkflowKeys } from '@/api/admissionsWorkflow';
import { QueryErrorNotice } from '@/components/query-error';
import { admissionsWorkflowRepository } from '@/data/admissionsWorkflow';
import type { AdmissionsWorkflowStage } from '@/types/admissionsWorkflow';

import type { StageFormValues } from '../forms';
import { StageModal } from './StageModal';

interface StageCardProps {
  stage: AdmissionsWorkflowStage;
  onEdit: (stage: AdmissionsWorkflowStage) => void;
}

function StageCard({ stage, onEdit }: StageCardProps) {
  return (
    <Card className="flex items-start gap-4">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-sm font-semibold text-foreground">
        {stage.rejectionBranch ? 'R' : stage.order}
      </span>
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-base font-medium text-foreground">{stage.applicantLabel}</span>
          <Badge variant="outline" size="sm">
            {stage.staffStatusKey}
          </Badge>
          {stage.notifyOnEnter && (
            <Badge variant="primary" size="sm">
              <BellRing size={12} strokeWidth={2} aria-hidden />
              Notifies SA.08
            </Badge>
          )}
          {stage.terminal && (
            <Badge variant="success" size="sm">
              Terminal
            </Badge>
          )}
          {stage.showsAppealRights && (
            <Badge variant="warning" size="sm">
              Shows appeal rights
            </Badge>
          )}
        </div>
        <p className="text-sm text-foreground-muted">{stage.applicantDescription}</p>
      </div>
      <Button variant="ghost" size="sm" onClick={() => onEdit(stage)}>
        <Pencil size={16} strokeWidth={2} aria-hidden />
        Edit
      </Button>
    </Card>
  );
}

/**
 * The applicant-facing SA.01 status chain (B-01) and its rejection branch.
 * Stage order and transitions are S027-owned; only presentation is editable
 * here, and every edit records to the S003 audit seam.
 */
export function WorkflowStages() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const stages = useQuery({
    queryKey: admissionsWorkflowKeys.stages(),
    queryFn: () => admissionsWorkflowRepository.list(),
  });

  const [editing, setEditing] = useState<AdmissionsWorkflowStage | null>(null);
  const [modalKey, setModalKey] = useState(0);

  function openEdit(stage: AdmissionsWorkflowStage) {
    setEditing(stage);
    setModalKey((key) => key + 1);
  }

  async function handleSubmit(values: StageFormValues) {
    if (!editing) return;
    await admissionsWorkflowRepository.updateStage(editing.id, values);
    toast({ title: 'Stage presentation updated', variant: 'success' });
    await queryClient.invalidateQueries({ queryKey: admissionsWorkflowKeys.stages() });
  }

  if (stages.isLoading) return <PageSkeleton />;

  if (stages.isError) {
    return <QueryErrorNotice title="Workflow unavailable" onRetry={() => void stages.refetch()} />;
  }

  const linearStages = (stages.data ?? []).filter((stage) => !stage.rejectionBranch);
  const branchStages = (stages.data ?? []).filter((stage) => stage.rejectionBranch);

  if (linearStages.length === 0 && branchStages.length === 0) {
    return (
      <Notice variant="info" title="No workflow stages">
        The S027 admissions pipeline has not published any stages yet. The applicant chain will
        appear here once it does.
      </Notice>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        {linearStages.map((stage, index) => (
          <div key={stage.id} className="flex flex-col gap-2">
            {index > 0 && (
              <ArrowDown
                size={16}
                strokeWidth={2}
                className="ml-8 text-foreground-muted"
                aria-hidden
              />
            )}
            <StageCard stage={stage} onEdit={openEdit} />
          </div>
        ))}
      </div>
      {branchStages.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-medium uppercase tracking-wider text-foreground-muted">
            Rejection branch (from Decision pending)
          </h2>
          {branchStages.map((stage) => (
            <StageCard key={stage.id} stage={stage} onEdit={openEdit} />
          ))}
        </div>
      )}
      <StageModal
        key={modalKey}
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        stage={editing}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
