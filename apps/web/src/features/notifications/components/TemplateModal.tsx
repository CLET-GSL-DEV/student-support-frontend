import { useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Dropdown,
  Field,
  FieldControl,
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

import type { NotificationCategory, NotificationTemplate } from '@/types/notifications';

import { type TemplateFormValues, templateFormSchema } from '../forms';

interface TemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null creates a new template; a template edits it. */
  template: NotificationTemplate | null;
  categories: NotificationCategory[];
  onSubmit: (values: TemplateFormValues) => Promise<void>;
}

/** Create/edit modal for a notification content template (feeds S025 and
 * the Push Notification Service). */
export function TemplateModal({
  open,
  onOpenChange,
  template,
  categories,
  onSubmit,
}: TemplateModalProps) {
  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      categoryId: template?.categoryId ?? '',
      name: template?.name ?? '',
      pushTitle: template?.pushTitle ?? '',
      pushBody: template?.pushBody ?? '',
      inboxBody: template?.inboxBody ?? '',
    },
  });

  const categoryOptions = categories.map((category) => ({
    value: category.id,
    label: category.name,
  }));

  const handleSubmit = async (values: TemplateFormValues) => {
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
        <ModalContent showCloseButton size="lg">
          <ModalHeader>
            <ModalTitle>{template ? 'Edit template' : 'Add template'}</ModalTitle>
          </ModalHeader>
          <Form {...form}>
            <ModalBody>
              <div className="flex flex-col gap-4">
                {form.formState.errors.root && (
                  <Notice variant="error">{form.formState.errors.root.message}</Notice>
                )}
                <Notice variant="warning" title="Push content is minimised">
                  Push payloads appear on lock screens and must contain no sensitive personal data
                  (NFR-PR2). Welfare pushes must say only that an update exists, with the detail
                  kept to the authenticated inbox (G-03).
                </Notice>
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field, fieldState }) => (
                    <Field invalid={!!fieldState.error}>
                      <FieldLabel>Category</FieldLabel>
                      <FieldControl>
                        <Dropdown
                          aria-label="Category"
                          value={field.value || null}
                          onValueChange={(value) => field.onChange(value ?? '')}
                          options={categoryOptions}
                          placeholder="Select a category"
                          invalid={!!fieldState.error}
                        />
                      </FieldControl>
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </Field>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <Field invalid={!!fieldState.error}>
                      <FieldLabel>Template name</FieldLabel>
                      <FieldControl>
                        <Input placeholder="e.g. Results available" {...field} />
                      </FieldControl>
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </Field>
                  )}
                />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="pushTitle"
                    render={({ field, fieldState }) => (
                      <Field invalid={!!fieldState.error}>
                        <FieldLabel>Push title</FieldLabel>
                        <FieldControl>
                          <Input placeholder="e.g. Results" {...field} />
                        </FieldControl>
                        <FieldError>{fieldState.error?.message}</FieldError>
                      </Field>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pushBody"
                    render={({ field, fieldState }) => (
                      <Field invalid={!!fieldState.error}>
                        <FieldLabel>Push body</FieldLabel>
                        <FieldControl>
                          <Input placeholder="e.g. Your results are available" {...field} />
                        </FieldControl>
                        <FieldError>{fieldState.error?.message}</FieldError>
                      </Field>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="inboxBody"
                  render={({ field, fieldState }) => (
                    <Field invalid={!!fieldState.error}>
                      <FieldLabel>Inbox body</FieldLabel>
                      <FieldControl>
                        <Textarea
                          rows={4}
                          placeholder="Full message shown inside the SA.08 inbox after sign-in"
                          {...field}
                        />
                      </FieldControl>
                      <FieldError>{fieldState.error?.message}</FieldError>
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
                {template ? 'Save changes' : 'Add template'}
              </Button>
            </ModalFooter>
          </Form>
        </ModalContent>
      </ModalPortal>
    </Modal>
  );
}
