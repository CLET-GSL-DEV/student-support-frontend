import { useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Checkbox,
  DateRangeSelector,
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

import {
  ACADEMIC_STANDINGS,
  ACADEMIC_STANDING_LABELS,
  PROGRAMMES,
  type ScholarshipWindow,
  YEARS_OF_STUDY,
} from '@/types/scholarships';

import { type WindowFormValues, windowFormSchema } from '../forms';

interface WindowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null creates a new window; a window edits it. */
  window: ScholarshipWindow | null;
  onSubmit: (values: WindowFormValues) => Promise<void>;
}

const STANDING_OPTIONS = Object.values(ACADEMIC_STANDINGS).map((standing) => ({
  value: standing,
  label: ACADEMIC_STANDING_LABELS[standing],
}));

/** Create/edit modal for a scholarship listing and its application window
 * (SA.13, F-01). */
export function WindowModal({ open, onOpenChange, window, onSubmit }: WindowModalProps) {
  const form = useForm<WindowFormValues>({
    resolver: zodResolver(windowFormSchema),
    defaultValues: {
      name: window?.name ?? '',
      description: window?.description ?? '',
      minStanding: window?.minStanding ?? ACADEMIC_STANDINGS.ANY,
      programmes: window?.programmes ?? [],
      yearsOfStudy: window?.yearsOfStudy ?? [],
      window: {
        start: window ? new Date(window.opensAt) : null,
        end: window ? new Date(window.closesAt) : null,
      },
    },
  });

  const handleSubmit = async (values: WindowFormValues) => {
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
            <ModalTitle>{window ? 'Edit scholarship' : 'Add scholarship'}</ModalTitle>
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
                        <Input placeholder="e.g. GSL Merit Scholarship" {...field} />
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
                          placeholder="What the scholarship covers and who it is for"
                          {...field}
                        />
                      </FieldControl>
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </Field>
                  )}
                />
                <FormField
                  control={form.control}
                  name="window"
                  render={({ field, fieldState }) => (
                    <Field invalid={!!fieldState.error}>
                      <FieldLabel>Application window</FieldLabel>
                      <FieldControl>
                        <DateRangeSelector
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select open and close dates"
                          invalid={!!fieldState.error}
                        />
                      </FieldControl>
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </Field>
                  )}
                />
                <FormField
                  control={form.control}
                  name="minStanding"
                  render={({ field, fieldState }) => (
                    <Field invalid={!!fieldState.error}>
                      <FieldLabel>Minimum academic standing</FieldLabel>
                      <FieldControl>
                        <Dropdown
                          aria-label="Minimum academic standing"
                          value={field.value}
                          onValueChange={(value) => field.onChange(value ?? ACADEMIC_STANDINGS.ANY)}
                          options={STANDING_OPTIONS}
                          invalid={!!fieldState.error}
                        />
                      </FieldControl>
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </Field>
                  )}
                />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="programmes"
                    render={({ field, fieldState }) => (
                      <Field invalid={!!fieldState.error}>
                        <FieldLabel>Programmes</FieldLabel>
                        <FieldControl>
                          <div className="flex items-center gap-4">
                            {PROGRAMMES.map((programme) => (
                              <Checkbox
                                key={programme}
                                label={programme}
                                checked={field.value.includes(programme)}
                                onCheckedChange={(checked) =>
                                  field.onChange(
                                    checked
                                      ? [...field.value, programme]
                                      : field.value.filter((value) => value !== programme),
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
                    name="yearsOfStudy"
                    render={({ field, fieldState }) => (
                      <Field invalid={!!fieldState.error}>
                        <FieldLabel>Years of study</FieldLabel>
                        <FieldControl>
                          <div className="flex items-center gap-4">
                            {YEARS_OF_STUDY.map((year) => (
                              <Checkbox
                                key={year}
                                label={`Year ${year}`}
                                checked={field.value.includes(year)}
                                onCheckedChange={(checked) =>
                                  field.onChange(
                                    checked
                                      ? [...field.value, year]
                                      : field.value.filter((value) => value !== year),
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
                </div>
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
                {window ? 'Save changes' : 'Add scholarship'}
              </Button>
            </ModalFooter>
          </Form>
        </ModalContent>
      </ModalPortal>
    </Modal>
  );
}
