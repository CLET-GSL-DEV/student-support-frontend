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
import { BellRing, Pencil, Plus, Trash2 } from 'lucide-react';

import { formatDate } from '@starter/utils';

import { notificationsKeys } from '@/api/notifications';
import { ConfirmDialog } from '@/components/confirm';
import { QueryErrorNotice } from '@/components/query-error';
import { notificationsRepository } from '@/data/notifications';
import type { NotificationTemplate } from '@/types/notifications';

import type { TemplateFormValues } from '../forms';
import { TemplateModal } from './TemplateModal';

/**
 * Notification content templates by category; the configuration S025 and the
 * Push Notification Service deliver from.
 * // SPEC: templating detail (variables, localisation) is not in the SRS.
 */
export function TemplatesTable() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const templates = useQuery({
    queryKey: notificationsKeys.templates(),
    queryFn: () => notificationsRepository.listTemplates(),
  });
  const categories = useQuery({
    queryKey: notificationsKeys.categories(),
    queryFn: () => notificationsRepository.listCategories(),
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<NotificationTemplate | null>(null);
  const [deleting, setDeleting] = useState<NotificationTemplate | null>(null);
  const [modalKey, setModalKey] = useState(0);

  const categoryNames = useMemo(() => {
    const names = new Map<string, string>();
    for (const category of categories.data ?? []) names.set(category.id, category.name);
    return names;
  }, [categories.data]);

  function openCreate() {
    setEditing(null);
    setModalKey((key) => key + 1);
    setModalOpen(true);
  }

  function openEdit(template: NotificationTemplate) {
    setEditing(template);
    setModalKey((key) => key + 1);
    setModalOpen(true);
  }

  async function invalidateTemplates() {
    await queryClient.invalidateQueries({ queryKey: notificationsKeys.templates() });
  }

  async function handleSubmit(values: TemplateFormValues) {
    if (editing) {
      await notificationsRepository.updateTemplate(editing.id, values);
      toast({ title: 'Template updated', variant: 'success' });
    } else {
      await notificationsRepository.createTemplate(values);
      toast({ title: 'Template added', variant: 'success' });
    }
    await invalidateTemplates();
  }

  const deleteMutation = useMutation({
    mutationFn: (template: NotificationTemplate) =>
      notificationsRepository.deleteTemplate(template.id),
    onSuccess: async () => {
      toast({ title: 'Template deleted', variant: 'success' });
      setDeleting(null);
      await invalidateTemplates();
    },
    onError: (error) => {
      toast({
        title: 'Could not delete template',
        description: error instanceof Error ? error.message : undefined,
        variant: 'error',
      });
      setDeleting(null);
    },
  });

  const columns = useMemo<TableColumn<NotificationTemplate>[]>(
    () => [
      { id: 'name', header: 'Template', accessorKey: 'name' },
      {
        id: 'category',
        header: 'Category',
        width: 180,
        accessorFn: (template) => (
          <Badge variant="outline" size="sm">
            {categoryNames.get(template.categoryId) ?? 'Unknown'}
          </Badge>
        ),
      },
      { id: 'pushBody', header: 'Push body', accessorKey: 'pushBody' },
      {
        id: 'updatedAt',
        header: 'Updated',
        width: 140,
        accessorFn: (template) => formatDate(new Date(template.updatedAt), { dateStyle: 'medium' }),
      },
    ],
    [categoryNames],
  );

  if (templates.isError) {
    return (
      <QueryErrorNotice title="Templates unavailable" onRetry={() => void templates.refetch()} />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Table paramPrefix="notification-templates">
        <TableHeader>
          <TableActions>
            <Button variant="primary" size="sm" onClick={openCreate}>
              <Plus size={16} strokeWidth={2} aria-hidden />
              Add template
            </Button>
          </TableActions>
        </TableHeader>
        <TableContent
          variant="panel"
          columns={columns}
          data={templates.data ?? []}
          rowKey={(template) => template.id}
          loading={templates.isLoading}
          loadingRows={6}
          emptyIcon={<BellRing size={20} strokeWidth={2} aria-hidden />}
          emptyText="No notification templates configured yet"
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
              onClick: (template) => setDeleting(template),
            },
          ]}
        />
      </Table>
      <TemplateModal
        key={modalKey}
        open={modalOpen}
        onOpenChange={setModalOpen}
        template={editing}
        categories={categories.data ?? []}
        onSubmit={handleSubmit}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Delete template?"
        description={`"${deleting?.name ?? ''}" will no longer be available to S025 for delivery.`}
        confirmLabel="Delete template"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleting) deleteMutation.mutate(deleting);
        }}
      />
    </div>
  );
}
