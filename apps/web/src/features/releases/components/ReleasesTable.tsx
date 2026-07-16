import { useMemo, useState } from 'react';

import {
  Badge,
  type BadgeVariant,
  Button,
  Table,
  TableActions,
  type TableColumn,
  TableContent,
  TableHeader,
  useToast,
} from '@rfdtech/components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardCheck, Plus, Rocket, Send, ShieldCheck } from 'lucide-react';

import { formatDate } from '@starter/utils';

import { releasesKeys } from '@/api/releases';
import { QueryErrorNotice } from '@/components/query-error';
import { useStepUp } from '@/components/step-up';
import { releasesRepository } from '@/data/releases';
import {
  type AppRelease,
  PLATFORM_LABELS,
  RELEASE_STATUSES,
  RELEASE_STATUS_LABELS,
  type ReleaseStatus,
  type WcagAuditStatus,
} from '@/types/releases';

import type { AuditResultFormValues, ReleaseFormValues } from '../forms';
import { AuditResultModal } from './AuditResultModal';
import { ReleaseModal } from './ReleaseModal';

const STATUS_VARIANTS: Record<ReleaseStatus, BadgeVariant> = {
  [RELEASE_STATUSES.DRAFT]: 'outline',
  [RELEASE_STATUSES.WCAG_AUDIT]: 'primary',
  [RELEASE_STATUSES.AWAITING_APPROVAL]: 'warning',
  [RELEASE_STATUSES.APPROVED]: 'success',
  [RELEASE_STATUSES.SUBMITTED]: 'primary',
  [RELEASE_STATUSES.RELEASED]: 'success',
  [RELEASE_STATUSES.REJECTED]: 'error',
};

const WCAG_VARIANTS: Record<WcagAuditStatus, BadgeVariant> = {
  pending: 'outline',
  passed: 'success',
  failed: 'error',
};

/**
 * The release-governance pipeline (§1.2, §2.2): WCAG 2.1 AA audit gating
 * (CON-L1) then CLET DG step-up approval for statutory-impacting releases
 * (CON-G1). The admin surfaces and initiates; the DG approves via TOTP
 * step-up. Every event records to the S003 audit seam.
 */
export function ReleasesTable() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const stepUp = useStepUp();
  const releases = useQuery({
    queryKey: releasesKeys.list(),
    queryFn: () => releasesRepository.list(),
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [recordingAudit, setRecordingAudit] = useState<AppRelease | null>(null);
  const [modalKey, setModalKey] = useState(0);

  async function invalidateReleases() {
    await queryClient.invalidateQueries({ queryKey: releasesKeys.list() });
  }

  function mutationHandlers(successTitle: string) {
    return {
      onSuccess: async () => {
        toast({ title: successTitle, variant: 'success' as const });
        await invalidateReleases();
      },
      onError: (error: unknown) => {
        toast({
          title: 'Action failed',
          description: error instanceof Error ? error.message : undefined,
          variant: 'error' as const,
        });
      },
    };
  }

  const requestAuditMutation = useMutation({
    mutationFn: (release: AppRelease) => releasesRepository.requestAudit(release.id),
    ...mutationHandlers('Release sent for WCAG audit'),
  });

  const approveMutation = useMutation({
    mutationFn: (release: AppRelease) => releasesRepository.approve(release.id),
    ...mutationHandlers('Release approved'),
  });

  const submitMutation = useMutation({
    mutationFn: (release: AppRelease) => releasesRepository.markSubmitted(release.id),
    ...mutationHandlers('Release marked as submitted'),
  });

  async function handleCreate(values: ReleaseFormValues) {
    await releasesRepository.create(values);
    toast({ title: 'Release prepared', variant: 'success' });
    await invalidateReleases();
  }

  async function handleAuditResult(values: AuditResultFormValues) {
    if (!recordingAudit) return;
    await releasesRepository.recordAuditResult(recordingAudit.id, values);
    toast({ title: 'WCAG audit result recorded', variant: 'success' });
    await invalidateReleases();
  }

  const columns = useMemo<TableColumn<AppRelease>[]>(
    () => [
      { id: 'version', header: 'Version', width: 90, accessorKey: 'version' },
      { id: 'summary', header: 'Summary', accessorKey: 'summary' },
      {
        id: 'platforms',
        header: 'Stores',
        width: 170,
        accessorFn: (release) => (
          <span className="flex flex-wrap gap-1">
            {release.platforms.map((platform) => (
              <Badge key={platform} variant="outline" size="sm">
                {PLATFORM_LABELS[platform]}
              </Badge>
            ))}
          </span>
        ),
      },
      {
        id: 'statutory',
        header: 'Governance',
        width: 150,
        accessorFn: (release) =>
          release.statutoryImpacting ? (
            <Badge variant="warning" size="sm">
              DG approval required
            </Badge>
          ) : (
            <Badge variant="outline" size="sm">
              Standard
            </Badge>
          ),
      },
      {
        id: 'wcag',
        header: 'WCAG 2.1 AA',
        width: 120,
        accessorFn: (release) => (
          <Badge variant={WCAG_VARIANTS[release.wcagAudit.status]} size="sm">
            {release.wcagAudit.status === 'pending'
              ? 'Audit pending'
              : release.wcagAudit.status === 'passed'
                ? 'Passed'
                : 'Failed'}
          </Badge>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        width: 160,
        accessorFn: (release) => (
          <Badge variant={STATUS_VARIANTS[release.status]} size="sm">
            {RELEASE_STATUS_LABELS[release.status]}
          </Badge>
        ),
      },
      {
        id: 'updatedAt',
        header: 'Updated',
        width: 130,
        accessorFn: (release) => formatDate(new Date(release.updatedAt), { dateStyle: 'medium' }),
      },
    ],
    [],
  );

  if (releases.isError) {
    return (
      <QueryErrorNotice title="Releases unavailable" onRetry={() => void releases.refetch()} />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Table paramPrefix="releases">
        <TableHeader>
          <TableActions>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setModalKey((key) => key + 1);
                setCreateOpen(true);
              }}
            >
              <Plus size={16} strokeWidth={2} aria-hidden />
              Prepare release
            </Button>
          </TableActions>
        </TableHeader>
        <TableContent
          variant="panel"
          columns={columns}
          data={releases.data ?? []}
          rowKey={(release) => release.id}
          loading={releases.isLoading}
          loadingRows={3}
          emptyIcon={<Rocket size={20} strokeWidth={2} aria-hidden />}
          emptyText="No releases in the governance pipeline"
          rowActions={[
            {
              id: 'request-audit',
              label: 'Send for WCAG audit',
              icon: <ClipboardCheck size={16} strokeWidth={2} aria-hidden />,
              condition: (release) => release.status === RELEASE_STATUSES.DRAFT,
              onClick: (release) => requestAuditMutation.mutate(release),
            },
            {
              id: 'record-audit',
              label: 'Record audit result',
              icon: <ClipboardCheck size={16} strokeWidth={2} aria-hidden />,
              condition: (release) => release.status === RELEASE_STATUSES.WCAG_AUDIT,
              onClick: (release) => {
                setModalKey((key) => key + 1);
                setRecordingAudit(release);
              },
            },
            {
              id: 'approve',
              label: 'Approve (DG step-up)',
              icon: <ShieldCheck size={16} strokeWidth={2} aria-hidden />,
              condition: (release) => release.status === RELEASE_STATUSES.AWAITING_APPROVAL,
              onClick: (release) => stepUp.guard(() => approveMutation.mutate(release)),
            },
            {
              id: 'submit',
              label: 'Mark submitted to stores',
              icon: <Send size={16} strokeWidth={2} aria-hidden />,
              condition: (release) => release.status === RELEASE_STATUSES.APPROVED,
              onClick: (release) => submitMutation.mutate(release),
            },
          ]}
        />
      </Table>
      <ReleaseModal
        key={`create-${modalKey}`}
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
      />
      <AuditResultModal
        key={`audit-${modalKey}`}
        open={recordingAudit !== null}
        onOpenChange={(open) => {
          if (!open) setRecordingAudit(null);
        }}
        release={recordingAudit}
        onSubmit={handleAuditResult}
      />
      {stepUp.dialog}
    </div>
  );
}
