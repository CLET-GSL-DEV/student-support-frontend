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

import { useDirtyClose } from '@/components/dirty-close';
import type { AdmissionsWorkflowStage } from '@/types/admissionsWorkflow';

import { type StageFormValues, stageFormSchema } from '../forms';

interface StageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stage: AdmissionsWorkflowStage | null;
  onSubmit: (values: StageFormValues) => Promise<void>;
}

/** Edit modal for an SA.01 stage's applicant-facing presentation (B-01).
 * The stage itself (staff status key, position, transitions) is S027-owned
 * and read-only. */
export function StageModal({ open, onOpenChange, stage, onSubmit }: StageModalProps) {
  const form = useForm<StageFormValues>({
    resolver: zodResolver(stageFormSchema),
    defaultValues: {
      applicantLabel: stage?.applicantLabel ?? '',
      applicantDescription: stage?.applicantDescription ?? '',
      notifyOnEnter: stage?.notifyOnEnter ?? true,
    },
  });

  const dirtyClose = useDirtyClose(form.formState.isDirty, onOpenChange);

  const handleSubmit = async (values: StageFormValues) => {
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
    <Modal open={open} onOpenChange={dirtyClose.handleOpenChange}>
      <ModalPortal>
        <ModalOverlay />
        <ModalContent showCloseButton size="md">
          <ModalHeader>
            <ModalTitle>Edit stage presentation</ModalTitle>
          </ModalHeader>
          <Form {...form}>
            <ModalBody>
              <div className="flex flex-col gap-4">
                {form.formState.errors.root && (
                  <Notice variant="error">{form.formState.errors.root.message}</Notice>
                )}
                <Field>
                  <FieldLabel>Staff status key (S027)</FieldLabel>
                  <FieldControl>
                    <Input value={stage?.staffStatusKey ?? ''} disabled readOnly />
                  </FieldControl>
                  <FieldDescription>
                    Owned by the S027 admissions pipeline; not editable here (§2.4).
                  </FieldDescription>
                </Field>
                <FormField
                  control={form.control}
                  name="applicantLabel"
                  render={({ field, fieldState }) => (
                    <Field invalid={!!fieldState.error}>
                      <FieldLabel>Applicant label</FieldLabel>
                      <FieldControl>
                        <Input placeholder="e.g. Under review" {...field} />
                      </FieldControl>
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </Field>
                  )}
                />
                <FormField
                  control={form.control}
                  name="applicantDescription"
                  render={({ field, fieldState }) => (
                    <Field invalid={!!fieldState.error}>
                      <FieldLabel>Applicant description</FieldLabel>
                      <FieldControl>
                        <Textarea
                          rows={3}
                          placeholder="What the applicant is told this status means"
                          {...field}
                        />
                      </FieldControl>
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </Field>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notifyOnEnter"
                  render={({ field }) => (
                    <Field>
                      <FieldControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          label="Send an SA.08 notification when this stage is reached"
                        />
                      </FieldControl>
                      <FieldDescription>
                        B-01 expects every status transition to trigger a notification.
                      </FieldDescription>
                    </Field>
                  )}
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="ghost"
                type="button"
                onClick={() => dirtyClose.handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="button"
                loading={form.formState.isSubmitting}
                loadingLabel="Saving"
                onClick={() => void form.handleSubmit(handleSubmit)()}
              >
                Save changes
              </Button>
            </ModalFooter>
          </Form>
          {dirtyClose.dialog}
        </ModalContent>
      </ModalPortal>
    </Modal>
  );
}
