import { useMemo, useState } from 'react';

import {
  Badge,
  Button,
  Notice,
  Table,
  TableActions,
  type TableColumn,
  TableContent,
  TableHeader,
  useToast,
} from '@rfdtech/components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BellRing, Lock, Pencil, Plus, Trash2 } from 'lucide-react';

import { formatDate } from '@starter/utils';

import { notificationsKeys } from '@/api/notifications';
import { ConfirmDialog } from '@/components/confirm';
import { QueryErrorNotice } from '@/components/query-error';
import { notificationsRepository } from '@/data/notifications';
import { useCreateParam } from '@/hooks/useCreateParam';
import type { NotificationCategory } from '@/types/notifications';

import type { CategoryFormValues } from '../forms';
import { CategoryModal } from './CategoryModal';

/**
 * Category management (placeholder CRUD per the SRS scope). The statutory
 * flag defines the G-02 no-opt-out list the student app consumes as locked;
 * the four baseline categories cannot be deleted or made optional.
 */
export function CategoriesTable() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const categories = useQuery({
    queryKey: notificationsKeys.categories(),
    queryFn: () => notificationsRepository.listCategories(),
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<NotificationCategory | null>(null);
  const [deleting, setDeleting] = useState<NotificationCategory | null>(null);
  const [modalKey, setModalKey] = useState(0);

  function openCreate() {
    setEditing(null);
    setModalKey((key) => key + 1);
    setModalOpen(true);
  }

  // Dashboard quick action: /notifications?new=category
  useCreateParam('category', openCreate);

  function openEdit(category: NotificationCategory) {
    setEditing(category);
    setModalKey((key) => key + 1);
    setModalOpen(true);
  }

  async function invalidateCategories() {
    await queryClient.invalidateQueries({ queryKey: notificationsKeys.categories() });
  }

  async function handleSubmit(values: CategoryFormValues) {
    if (editing) {
      await notificationsRepository.updateCategory(editing.id, values);
      toast({ title: 'Category updated', variant: 'success' });
    } else {
      await notificationsRepository.createCategory(values);
      toast({ title: 'Category added', variant: 'success' });
    }
    await invalidateCategories();
  }

  const deleteMutation = useMutation({
    mutationFn: (category: NotificationCategory) =>
      notificationsRepository.deleteCategory(category.id),
    onSuccess: async () => {
      toast({ title: 'Category deleted', variant: 'success' });
      setDeleting(null);
      await invalidateCategories();
    },
    onError: (error) => {
      toast({
        title: 'Could not delete category',
        description: error instanceof Error ? error.message : undefined,
        variant: 'error',
      });
      setDeleting(null);
    },
  });

  const columns = useMemo<TableColumn<NotificationCategory>[]>(
    () => [
      {
        id: 'name',
        header: 'Category',
        accessorFn: (category) => (
          <span className="flex items-center gap-2">
            {category.name}
            {category.baseline && (
              <Lock size={14} strokeWidth={2} aria-label="Statutory baseline, locked" />
            )}
          </span>
        ),
      },
      {
        id: 'statutory',
        header: 'Opt-out',
        width: 160,
        accessorFn: (category) =>
          category.statutory ? (
            <Badge variant="warning" size="sm">
              Statutory, no opt-out
            </Badge>
          ) : (
            <Badge variant="outline" size="sm">
              Optional
            </Badge>
          ),
      },
      { id: 'description', header: 'Description', accessorKey: 'description' },
      {
        id: 'updatedAt',
        header: 'Updated',
        width: 140,
        accessorFn: (category) => formatDate(new Date(category.updatedAt), { dateStyle: 'medium' }),
      },
    ],
    [],
  );

  if (categories.isError) {
    return (
      <QueryErrorNotice title="Categories unavailable" onRetry={() => void categories.refetch()} />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Notice variant="info" title="Statutory baseline (G-02)">
        Results, admission decisions, exam notices, and welfare safety alerts are statutory: the
        student app locks them out of notification preferences. Categories added here define what
        SA.08 consumes.
      </Notice>
      <Table paramPrefix="notification-categories">
        <TableHeader>
          <TableActions>
            <Button variant="primary" size="sm" onClick={openCreate}>
              <Plus size={16} strokeWidth={2} aria-hidden />
              Add category
            </Button>
          </TableActions>
        </TableHeader>
        <TableContent
          variant="panel"
          columns={columns}
          data={categories.data ?? []}
          rowKey={(category) => category.id}
          loading={categories.isLoading}
          loadingRows={6}
          emptyIcon={<BellRing size={20} strokeWidth={2} aria-hidden />}
          emptyText="No notification categories configured yet"
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
              condition: (category) => !category.baseline,
              onClick: (category) => setDeleting(category),
            },
          ]}
        />
      </Table>
      <CategoryModal
        key={modalKey}
        open={modalOpen}
        onOpenChange={setModalOpen}
        category={editing}
        onSubmit={handleSubmit}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Delete category?"
        description={`"${deleting?.name ?? ''}" will no longer be available for templates or student notification preferences.`}
        confirmLabel="Delete category"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleting) deleteMutation.mutate(deleting);
        }}
      />
    </div>
  );
}
