import { useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Checkbox,
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
  Form,
  FormField,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalPortal,
  ModalTitle,
  Notice,
  Textarea,
} from '@rfdtech/components';

import type { NotificationCategory } from '@/types/notifications';

import { type CategoryFormValues, categoryFormSchema } from '../forms';

interface CategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null creates a new category; a category edits it. */
  category: NotificationCategory | null;
  onSubmit: (values: CategoryFormValues) => Promise<void>;
}

/** Create/edit modal for a notification category. Baseline categories keep
 * their statutory flag locked (G-02). */
export function CategoryModal({ open, onOpenChange, category, onSubmit }: CategoryModalProps) {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: category?.name ?? '',
      description: category?.description ?? '',
      statutory: category?.statutory ?? false,
    },
  });

  const handleSubmit = async (values: CategoryFormValues) => {
    try {
      await onSubmit(values);
      onOpenChange(false);
    } catch (error) {
      form.setError('root', {
        message: error instanceof Error ? error.message : 'Something went wrong. Try again.',
      });
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalPortal>
        <ModalOverlay />
        <ModalContent showCloseButton size="md">
          <ModalHeader>
            <ModalTitle>{category ? 'Edit category' : 'Add category'}</ModalTitle>
          </ModalHeader>
          <Form {...form}>
            <ModalBody>
              <div className="flex flex-col gap-4">
                {form.formState.errors.root && (
                  <Notice variant="error">{form.formState.errors.root.message}</Notice>
                )}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <Field invalid={!!fieldState.error}>
                      <FieldLabel>Name</FieldLabel>
                      <FieldControl>
                        <Input placeholder="e.g. Library" {...field} />
                      </FieldControl>
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </Field>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field, fieldState }) => (
                    <Field invalid={!!fieldState.error}>
                      <FieldLabel>Description</FieldLabel>
                      <FieldControl>
                        <Textarea
                          rows={2}
                          placeholder="What this category delivers to students"
                          {...field}
                        />
                      </FieldControl>
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </Field>
                  )}
                />
                <FormField
                  control={form.control}
                  name="statutory"
                  render={({ field }) => (
                    <Field>
                      <FieldControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={category?.baseline}
                          label="Statutory (students cannot opt out)"
                        />
                      </FieldControl>
                      {category?.baseline && (
                        <FieldDescription>
                          This is a statutory baseline category (results, admission decisions, exam
                          notices, welfare safety alerts). It cannot be made optional (G-02).
                        </FieldDescription>
                      )}
                    </Field>
                  )}
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" type="button" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                type="button"
                loading={form.formState.isSubmitting}
                loadingLabel="Saving"
                onClick={() => void form.handleSubmit(handleSubmit)()}
              >
                {category ? 'Save changes' : 'Add category'}
              </Button>
            </ModalFooter>
          </Form>
        </ModalContent>
      </ModalPortal>
    </Modal>
  );
}
