import { useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Checkbox,
  Dropdown,
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

import {
  ALLOCATION_STRATEGIES,
  ALLOCATION_STRATEGY_LABELS,
  APPLICANT_GROUPS,
  APPLICANT_GROUP_LABELS,
  type HostelAllocationRule,
} from '@/types/hostelRules';

import { type RuleFormValues, ruleFormSchema } from '../forms';

interface RuleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null creates a new rule; a rule edits it. */
  rule: HostelAllocationRule | null;
  onSubmit: (values: RuleFormValues) => Promise<void>;
}

const GROUP_OPTIONS = Object.values(APPLICANT_GROUPS).map((group) => ({
  value: group,
  label: APPLICANT_GROUP_LABELS[group],
}));

const STRATEGY_OPTIONS = Object.values(ALLOCATION_STRATEGIES).map((strategy) => ({
  value: strategy,
  label: ALLOCATION_STRATEGY_LABELS[strategy],
}));

/** Create/edit modal for a hostel allocation rule (SA.10, D-01). */
export function RuleModal({ open, onOpenChange, rule, onSubmit }: RuleModalProps) {
  const form = useForm<RuleFormValues>({
    resolver: zodResolver(ruleFormSchema),
    defaultValues: {
      name: rule?.name ?? '',
      description: rule?.description ?? '',
      priority: rule?.priority ?? 1,
      appliesTo: rule?.appliesTo ?? APPLICANT_GROUPS.ALL,
      strategy: rule?.strategy ?? ALLOCATION_STRATEGIES.BALLOT,
      reservedSharePercent: rule?.reservedSharePercent ?? 0,
      active: rule?.active ?? true,
    },
  });

  const handleSubmit = async (values: RuleFormValues) => {
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
            <ModalTitle>{rule ? 'Edit allocation rule' : 'Add allocation rule'}</ModalTitle>
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
                        <Input placeholder="e.g. First-year hall reservation" {...field} />
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
                          placeholder="What this rule reserves and why"
                          {...field}
                        />
                      </FieldControl>
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </Field>
                  )}
                />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="appliesTo"
                    render={({ field, fieldState }) => (
                      <Field invalid={!!fieldState.error}>
                        <FieldLabel>Applies to</FieldLabel>
                        <FieldControl>
                          <Dropdown
                            aria-label="Applies to"
                            value={field.value}
                            onValueChange={(value) => field.onChange(value ?? APPLICANT_GROUPS.ALL)}
                            options={GROUP_OPTIONS}
                            invalid={!!fieldState.error}
                          />
                        </FieldControl>
                        <FieldError>{fieldState.error?.message}</FieldError>
                      </Field>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="strategy"
                    render={({ field, fieldState }) => (
                      <Field invalid={!!fieldState.error}>
                        <FieldLabel>Allocation strategy</FieldLabel>
                        <FieldControl>
                          <Dropdown
                            aria-label="Allocation strategy"
                            value={field.value}
                            onValueChange={(value) =>
                              field.onChange(value ?? ALLOCATION_STRATEGIES.BALLOT)
                            }
                            options={STRATEGY_OPTIONS}
                            invalid={!!fieldState.error}
                          />
                        </FieldControl>
                        <FieldError>{fieldState.error?.message}</FieldError>
                      </Field>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field, fieldState }) => (
                      <Field invalid={!!fieldState.error}>
                        <FieldLabel>Evaluation order</FieldLabel>
                        <FieldControl>
                          <Input
                            type="number"
                            min={1}
                            name={field.name}
                            ref={field.ref}
                            onBlur={field.onBlur}
                            value={Number.isNaN(field.value) ? '' : String(field.value)}
                            onChange={(event) => field.onChange(event.target.valueAsNumber)}
                          />
                        </FieldControl>
                        <FieldDescription>1 runs first in S120.</FieldDescription>
                        <FieldError>{fieldState.error?.message}</FieldError>
                      </Field>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="reservedSharePercent"
                    render={({ field, fieldState }) => (
                      <Field invalid={!!fieldState.error}>
                        <FieldLabel>Reserved share (%)</FieldLabel>
                        <FieldControl>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            name={field.name}
                            ref={field.ref}
                            onBlur={field.onBlur}
                            value={Number.isNaN(field.value) ? '' : String(field.value)}
                            onChange={(event) => field.onChange(event.target.valueAsNumber)}
                          />
                        </FieldControl>
                        <FieldError>{fieldState.error?.message}</FieldError>
                      </Field>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <Field>
                      <FieldControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          label="Active (S120 applies this rule in the next allocation run)"
                        />
                      </FieldControl>
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
                {rule ? 'Save changes' : 'Add rule'}
              </Button>
            </ModalFooter>
          </Form>
        </ModalContent>
      </ModalPortal>
    </Modal>
  );
}
