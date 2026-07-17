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
import { GraduationCap, Pencil, Plus, Trash2 } from 'lucide-react';

import { formatDate } from '@starter/utils';

import { scholarshipsKeys } from '@/api/scholarships';
import { ConfirmDialog } from '@/components/confirm';
import { QueryErrorNotice } from '@/components/query-error';
import { scholarshipsRepository } from '@/data/scholarships';
import { useCreateParam } from '@/hooks/useCreateParam';
import {
  ACADEMIC_STANDING_LABELS,
  type ScholarshipWindow,
  type WindowStatus,
  scholarshipWindowStatus,
} from '@/types/scholarships';

import type { WindowFormValues } from '../forms';
import { WindowModal } from './WindowModal';

const STATUS_META: Record<WindowStatus, { label: string; variant: BadgeVariant }> = {
  open: { label: 'Open', variant: 'success' },
  scheduled: { label: 'Scheduled', variant: 'primary' },
  closed: { label: 'Closed', variant: 'outline' },
};

function toInput(values: WindowFormValues) {
  return {
    name: values.name,
    description: values.description,
    minStanding: values.minStanding,
    programmes: values.programmes,
    yearsOfStudy: [...values.yearsOfStudy].sort((a, b) => a - b),
    // The schema guarantees both dates are set before submit reaches here.
    opensAt: (values.window.start as Date).toISOString(),
    closesAt: (values.window.end as Date).toISOString(),
  };
}

function eligibilitySummary(window: ScholarshipWindow): string {
  const years = window.yearsOfStudy.map((year) => `Y${year}`).join(', ');
  return `${ACADEMIC_STANDING_LABELS[window.minStanding]}; ${window.programmes.join(', ')}; ${years}`;
}

/** Scholarship listings and application windows (SA.13, F-01), feeding the
 * GSL Scholarship Management System. */
export function WindowsTable() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const windows = useQuery({
    queryKey: scholarshipsKeys.windows(),
    queryFn: () => scholarshipsRepository.list(),
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ScholarshipWindow | null>(null);
  const [deleting, setDeleting] = useState<ScholarshipWindow | null>(null);
  const [modalKey, setModalKey] = useState(0);

  function openCreate() {
    setEditing(null);
    setModalKey((key) => key + 1);
    setModalOpen(true);
  }

  // Dashboard quick action: /scholarships?new=window
  useCreateParam('window', openCreate);

  function openEdit(window: ScholarshipWindow) {
    setEditing(window);
    setModalKey((key) => key + 1);
    setModalOpen(true);
  }

  async function invalidateWindows() {
    await queryClient.invalidateQueries({ queryKey: scholarshipsKeys.windows() });
  }

  async function handleSubmit(values: WindowFormValues) {
    if (editing) {
      await scholarshipsRepository.update(editing.id, toInput(values));
      toast({ title: 'Scholarship updated', variant: 'success' });
    } else {
      await scholarshipsRepository.create(toInput(values));
      toast({ title: 'Scholarship added', variant: 'success' });
    }
    await invalidateWindows();
  }

  const deleteMutation = useMutation({
    mutationFn: (window: ScholarshipWindow) => scholarshipsRepository.remove(window.id),
    onSuccess: async () => {
      toast({ title: 'Scholarship deleted', variant: 'success' });
      setDeleting(null);
      await invalidateWindows();
    },
    onError: (error) => {
      toast({
        title: 'Could not delete scholarship',
        description: error instanceof Error ? error.message : undefined,
        variant: 'error',
      });
      setDeleting(null);
    },
  });

  const columns = useMemo<TableColumn<ScholarshipWindow>[]>(
    () => [
      { id: 'name', header: 'Scholarship', accessorKey: 'name' },
      {
        id: 'window',
        header: 'Application window',
        width: 220,
        accessorFn: (window) =>
          `${formatDate(new Date(window.opensAt), { dateStyle: 'medium' })} to ${formatDate(
            new Date(window.closesAt),
            { dateStyle: 'medium' },
          )}`,
      },
      {
        id: 'status',
        header: 'Status',
        width: 120,
        accessorFn: (window) => {
          const status = STATUS_META[scholarshipWindowStatus(window)];
          return (
            <Badge variant={status.variant} size="sm">
              {status.label}
            </Badge>
          );
        },
      },
      {
        id: 'eligibility',
        header: 'Eligibility (SA.13 pre-filter)',
        accessorFn: (window) => eligibilitySummary(window),
      },
    ],
    [],
  );

  if (windows.isError) {
    return (
      <QueryErrorNotice
        title="Scholarship windows unavailable"
        onRetry={() => void windows.refetch()}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Table paramPrefix="scholarship-windows">
        <TableHeader>
          <TableActions>
            <Button variant="primary" size="sm" onClick={openCreate}>
              <Plus size={16} strokeWidth={2} aria-hidden />
              Add scholarship
            </Button>
          </TableActions>
        </TableHeader>
        <TableContent
          variant="panel"
          columns={columns}
          data={windows.data ?? []}
          rowKey={(window) => window.id}
          loading={windows.isLoading}
          loadingRows={4}
          emptyIcon={<GraduationCap size={20} strokeWidth={2} aria-hidden />}
          emptyText="No scholarship windows configured yet"
          rowActions={[
            {
              id: 'edit',
              label: 'Edit',
              icon: <Pencil size={16} strokeWidth={2} aria-hidden />,
              onClick: openEdit,
            },
            {
              id: 'delete',
              label: 'Delete',
              icon: <Trash2 size={16} strokeWidth={2} aria-hidden />,
              variant: 'destructive',
              onClick: (window) => setDeleting(window),
            },
          ]}
        />
      </Table>
      <WindowModal
        key={modalKey}
        open={modalOpen}
        onOpenChange={setModalOpen}
        window={editing}
        onSubmit={handleSubmit}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Delete scholarship?"
        description={`"${deleting?.name ?? ''}" and its application window will no longer be available to the student app.`}
        confirmLabel="Delete scholarship"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleting) deleteMutation.mutate(deleting);
        }}
      />
    </div>
  );
}
