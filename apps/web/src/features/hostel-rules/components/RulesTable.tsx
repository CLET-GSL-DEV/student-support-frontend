import { useMemo, useState } from 'react';

import {
  Badge,
  Button,
  Table,
  TableActions,
  type TableColumn,
  TableContent,
  TableHeader,
  useToast,
} from '@rfdtech/components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Pencil, Plus, Trash2 } from 'lucide-react';

import { hostelRulesKeys } from '@/api/hostelRules';
import { ConfirmDialog } from '@/components/confirm';
import { QueryErrorNotice } from '@/components/query-error';
import { hostelRulesRepository } from '@/data/hostelRules';
import {
  ALLOCATION_STRATEGY_LABELS,
  APPLICANT_GROUP_LABELS,
  type HostelAllocationRule,
} from '@/types/hostelRules';

import type { RuleFormValues } from '../forms';
import { RuleModal } from './RuleModal';

/** Allocation rules for halls and hostels (SA.10, D-01), evaluated in
 * priority order by the GSL Hostel Management System. */
export function RulesTable() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const rules = useQuery({
    queryKey: hostelRulesKeys.rules(),
    queryFn: () => hostelRulesRepository.list(),
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<HostelAllocationRule | null>(null);
  const [deleting, setDeleting] = useState<HostelAllocationRule | null>(null);
  const [modalKey, setModalKey] = useState(0);

  function openCreate() {
    setEditing(null);
    setModalKey((key) => key + 1);
    setModalOpen(true);
  }

  function openEdit(rule: HostelAllocationRule) {
    setEditing(rule);
    setModalKey((key) => key + 1);
    setModalOpen(true);
  }

  async function invalidateRules() {
    await queryClient.invalidateQueries({ queryKey: hostelRulesKeys.rules() });
  }

  async function handleSubmit(values: RuleFormValues) {
    if (editing) {
      await hostelRulesRepository.update(editing.id, values);
      toast({ title: 'Allocation rule updated', variant: 'success' });
    } else {
      await hostelRulesRepository.create(values);
      toast({ title: 'Allocation rule added', variant: 'success' });
    }
    await invalidateRules();
  }

  const deleteMutation = useMutation({
    mutationFn: (rule: HostelAllocationRule) => hostelRulesRepository.remove(rule.id),
    onSuccess: async () => {
      toast({ title: 'Allocation rule deleted', variant: 'success' });
      setDeleting(null);
      await invalidateRules();
    },
    onError: (error) => {
      toast({
        title: 'Could not delete allocation rule',
        description: error instanceof Error ? error.message : undefined,
        variant: 'error',
      });
      setDeleting(null);
    },
  });

  const columns = useMemo<TableColumn<HostelAllocationRule>[]>(
    () => [
      {
        id: 'priority',
        header: 'Order',
        width: 80,
        align: 'center',
        accessorFn: (rule) => rule.priority,
      },
      { id: 'name', header: 'Rule', accessorKey: 'name' },
      {
        id: 'appliesTo',
        header: 'Applies to',
        width: 170,
        accessorFn: (rule) => APPLICANT_GROUP_LABELS[rule.appliesTo],
      },
      {
        id: 'strategy',
        header: 'Strategy',
        width: 190,
        accessorFn: (rule) => ALLOCATION_STRATEGY_LABELS[rule.strategy],
      },
      {
        id: 'share',
        header: 'Reserved share',
        width: 130,
        align: 'center',
        accessorFn: (rule) => `${rule.reservedSharePercent}%`,
      },
      {
        id: 'active',
        header: 'Status',
        width: 110,
        accessorFn: (rule) =>
          rule.active ? (
            <Badge variant="success" size="sm">
              Active
            </Badge>
          ) : (
            <Badge variant="outline" size="sm">
              Inactive
            </Badge>
          ),
      },
    ],
    [],
  );

  if (rules.isError) {
    return (
      <QueryErrorNotice title="Allocation rules unavailable" onRetry={() => void rules.refetch()} />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Table paramPrefix="hostel-allocation-rules">
        <TableHeader>
          <TableActions>
            <Button variant="primary" size="sm" onClick={openCreate}>
              <Plus size={16} strokeWidth={2} aria-hidden />
              Add rule
            </Button>
          </TableActions>
        </TableHeader>
        <TableContent
          variant="panel"
          columns={columns}
          data={rules.data ?? []}
          rowKey={(rule) => rule.id}
          loading={rules.isLoading}
          loadingRows={4}
          emptyIcon={<Building2 size={20} strokeWidth={2} aria-hidden />}
          emptyText="No allocation rules configured yet"
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
              onClick: (rule) => setDeleting(rule),
            },
          ]}
        />
      </Table>
      <RuleModal
        key={modalKey}
        open={modalOpen}
        onOpenChange={setModalOpen}
        rule={editing}
        onSubmit={handleSubmit}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Delete allocation rule?"
        description={`"${deleting?.name ?? ''}" will no longer apply to future allocation runs in the hostel system.`}
        confirmLabel="Delete rule"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleting) deleteMutation.mutate(deleting);
        }}
      />
    </div>
  );
}
