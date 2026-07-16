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

import { PLATFORMS, PLATFORM_LABELS } from '@/types/releases';

import { type ReleaseFormValues, releaseFormSchema } from '../forms';

interface ReleaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ReleaseFormValues) => Promise<void>;
}

/** Prepare a new app release for the governance pipeline (§1.2, CON-G1). */
export function ReleaseModal({ open, onOpenChange, onSubmit }: ReleaseModalProps) {
  const form = useForm<ReleaseFormValues>({
    resolver: zodResolver(releaseFormSchema),
    defaultValues: {
      version: '',
      summary: '',
      platforms: [],
      statutoryImpacting: false,
    },
  });

  const handleSubmit = async (values: ReleaseFormValues) => {
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
            <ModalTitle>Prepare release</ModalTitle>
          </ModalHeader>
          <Form {...form}>
            <ModalBody>
              <div className="flex flex-col gap-4">
                {form.formState.errors.root && (
                  <Notice variant="error">{form.formState.errors.root.message}</Notice>
                )}
                <FormField
                  control={form.control}
                  name="version"
                  render={({ field, fieldState }) => (
                    <Field invalid={!!fieldState.error}>
                      <FieldLabel>Version</FieldLabel>
                      <FieldControl>
                        <Input placeholder="e.g. 1.5.0" {...field} />
                      </FieldControl>
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </Field>
                  )}
                />
                <FormField
                  control={form.control}
                  name="summary"
                  render={({ field, fieldState }) => (
                    <Field invalid={!!fieldState.error}>
                      <FieldLabel>Summary</FieldLabel>
                      <FieldControl>
                        <Textarea rows={2} placeholder="What this release changes" {...field} />
                      </FieldControl>
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </Field>
                  )}
                />
                <FormField
                  control={form.control}
                  name="platforms"
                  render={({ field, fieldState }) => (
                    <Field invalid={!!fieldState.error}>
                      <FieldLabel>Stores</FieldLabel>
                      <FieldControl>
                        <div className="flex items-center gap-4">
                          {PLATFORMS.map((platform) => (
                            <Checkbox
                              key={platform}
                              label={PLATFORM_LABELS[platform]}
                              checked={field.value.includes(platform)}
                              onCheckedChange={(checked) =>
                                field.onChange(
                                  checked
                                    ? [...field.value, platform]
                                    : field.value.filter((value) => value !== platform),
                                )
                              }
                            />
                          ))}
                        </div>
                      </FieldControl>
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </Field>
                  )}
                />
                <FormField
                  control={form.control}
                  name="statutoryImpacting"
                  render={({ field }) => (
                    <Field>
                      <FieldControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          label="Statutory-impacting (accessibility, welfare, or fees)"
                        />
                      </FieldControl>
                      <FieldDescription>
                        Statutory-impacting releases require CLET DG step-up approval after the WCAG
                        audit passes (CON-G1).
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
                Prepare release
              </Button>
            </ModalFooter>
          </Form>
        </ModalContent>
      </ModalPortal>
    </Modal>
  );
}
