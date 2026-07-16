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
} from '@rfdtech/components';

import type { AppRelease } from '@/types/releases';

import { type AuditResultFormValues, auditResultFormSchema } from '../forms';

interface AuditResultModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  release: AppRelease | null;
  onSubmit: (values: AuditResultFormValues) => Promise<void>;
}

/** Record the independent WCAG 2.1 AA audit outcome for a release (CON-L1:
 * mandatory before each release; a failed audit blocks submission). */
export function AuditResultModal({ open, onOpenChange, release, onSubmit }: AuditResultModalProps) {
  const form = useForm<AuditResultFormValues>({
    resolver: zodResolver(auditResultFormSchema),
    defaultValues: { passed: true, auditor: '', reportRef: '' },
  });

  const handleSubmit = async (values: AuditResultFormValues) => {
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
            <ModalTitle>
              Record WCAG audit result{release ? ` for ${release.version}` : ''}
            </ModalTitle>
          </ModalHeader>
          <Form {...form}>
            <ModalBody>
              <div className="flex flex-col gap-4">
                {form.formState.errors.root && (
                  <Notice variant="error">{form.formState.errors.root.message}</Notice>
                )}
                <FormField
                  control={form.control}
                  name="auditor"
                  render={({ field, fieldState }) => (
                    <Field invalid={!!fieldState.error}>
                      <FieldLabel>Independent assessor</FieldLabel>
                      <FieldControl>
                        <Input placeholder="e.g. Accessible Ghana Ltd" {...field} />
                      </FieldControl>
                      <FieldDescription>
                        The audit must be conducted by an independent assessor on physical devices
                        (CON-L1).
                      </FieldDescription>
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </Field>
                  )}
                />
                <FormField
                  control={form.control}
                  name="reportRef"
                  render={({ field, fieldState }) => (
                    <Field invalid={!!fieldState.error}>
                      <FieldLabel>Audit report reference</FieldLabel>
                      <FieldControl>
                        <Input placeholder="e.g. WCAG-2026-015" {...field} />
                      </FieldControl>
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </Field>
                  )}
                />
                <FormField
                  control={form.control}
                  name="passed"
                  render={({ field }) => (
                    <Field>
                      <FieldControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          label="Audit passed (WCAG 2.1 AA, all screens)"
                        />
                      </FieldControl>
                      <FieldDescription>
                        A failed audit rejects the release; non-compliant screens must be fixed
                        before it can be prepared again (NFR-ACC1).
                      </FieldDescription>
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
                Record result
              </Button>
            </ModalFooter>
          </Form>
        </ModalContent>
      </ModalPortal>
    </Modal>
  );
}
