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
import { HeartHandshake, Pencil, Plus, Trash2 } from 'lucide-react';

import { welfareRoutingKeys } from '@/api/welfareRouting';
import { ConfirmDialog } from '@/components/confirm';
import { QueryErrorNotice } from '@/components/query-error';
import { welfareRoutingRepository } from '@/data/welfareRouting';
import {
  REFERRAL_CATEGORY_LABELS,
  ROUTING_PRIORITIES,
  type WelfareRoutingRule,
} from '@/types/welfareRouting';

import type { RuleFormValues } from '../forms';
import { RuleModal } from './RuleModal';

/** Routing-rule table for SA.12 self-referrals (E-01). Rules only; welfare
 * cases and their content never appear in this portal. */
export function RulesTable() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const rules = useQuery({
    queryKey: welfareRoutingKeys.rules(),
    queryFn: () => welfareRoutingRepository.list(),
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<WelfareRoutingRule | null>(null);
  const [deleting, setDeleting] = useState<WelfareRoutingRule | null>(null);
  const [modalKey, setModalKey] = useState(0);

  function openCreate() {
    setEditing(null);
    setModalKey((key) => key + 1);
    setModalOpen(true);
  }

  function openEdit(rule: WelfareRoutingRule) {
    setEditing(rule);
    setModalKey((key) => key + 1);
    setModalOpen(true);
  }

  async function invalidateRules() {
    await queryClient.invalidateQueries({ queryKey: welfareRoutingKeys.rules() });
  }

  async function handleSubmit(values: RuleFormValues) {
    if (editing) {
      await welfareRoutingRepository.update(editing.id, values);
      toast({ title: 'Routing rule updated', variant: 'success' });
    } else {
      await welfareRoutingRepository.create(values);
      toast({ title: 'Routing rule added', variant: 'success' });
    }
    await invalidateRules();
  }

  const deleteMutation = useMutation({
    mutationFn: (rule: WelfareRoutingRule) => welfareRoutingRepository.remove(rule.id),
    onSuccess: async () => {
      toast({ title: 'Routing rule deleted', variant: 'success' });
      setDeleting(null);
      await invalidateRules();
    },
    onError: (error) => {
      toast({
        title: 'Could not delete routing rule',
        description: error instanceof Error ? error.message : undefined,
        variant: 'error',
      });
      setDeleting(null);
    },
  });

  const columns = useMemo<TableColumn<WelfareRoutingRule>[]>(
    () => [
      {
        id: 'category',
        header: 'Referral category',
        width: 170,
        accessorFn: (rule) => REFERRAL_CATEGORY_LABELS[rule.category],
      },
      { id: 'routeTo', header: 'Routes to', accessorKey: 'routeTo' },
      {
        id: 'escalation',
        header: 'Escalation',
        accessorFn: (rule) => `${rule.escalateTo} after ${rule.escalateAfterHours}h`,
      },
      {
        id: 'priority',
        header: 'Priority',
        width: 110,
        accessorFn: (rule) =>
          rule.priority === ROUTING_PRIORITIES.CRISIS ? (
            <Badge variant="error" size="sm">
              Crisis
            </Badge>
          ) : (
            <Badge variant="outline" size="sm">
              Standard
            </Badge>
          ),
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
      <QueryErrorNotice title="Routing rules unavailable" onRetry={() => void rules.refetch()} />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Table paramPrefix="welfare-routing-rules">
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
          emptyIcon={<HeartHandshake size={20} strokeWidth={2} aria-hidden />}
          emptyText="No routing rules configured yet"
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
        title="Delete routing rule?"
        description={`New ${
          deleting ? REFERRAL_CATEGORY_LABELS[deleting.category].toLowerCase() : ''
        } referrals will fall back to S031's default routing.`}
        confirmLabel="Delete rule"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleting) deleteMutation.mutate(deleting);
        }}
      />
    </div>
  );
}
