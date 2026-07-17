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
} from '@rfdtech/components';

import { useDirtyClose } from '@/components/dirty-close';
import {
  REFERRAL_CATEGORIES,
  REFERRAL_CATEGORY_LABELS,
  ROUTING_PRIORITIES,
  type WelfareRoutingRule,
} from '@/types/welfareRouting';

import { type RuleFormValues, ruleFormSchema } from '../forms';

interface RuleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null creates a new rule; a rule edits it. */
  rule: WelfareRoutingRule | null;
  onSubmit: (values: RuleFormValues) => Promise<void>;
}

const CATEGORY_OPTIONS = REFERRAL_CATEGORIES.map((category) => ({
  value: category,
  label: REFERRAL_CATEGORY_LABELS[category],
}));

const PRIORITY_OPTIONS = [
  { value: ROUTING_PRIORITIES.STANDARD, label: 'Standard queue' },
  { value: ROUTING_PRIORITIES.CRISIS, label: 'Crisis (immediate)' },
];

/** Create/edit modal for a welfare routing rule (SA.12, E-01). Routing
 * targets are organisational units; no student or case data appears here. */
export function RuleModal({ open, onOpenChange, rule, onSubmit }: RuleModalProps) {
  const form = useForm<RuleFormValues>({
    resolver: zodResolver(ruleFormSchema),
    defaultValues: {
      category: rule?.category ?? 'counselling',
      routeTo: rule?.routeTo ?? '',
      escalateTo: rule?.escalateTo ?? '',
      escalateAfterHours: rule?.escalateAfterHours ?? 48,
      priority: rule?.priority ?? ROUTING_PRIORITIES.STANDARD,
      active: rule?.active ?? true,
    },
  });

  const dirtyClose = useDirtyClose(form.formState.isDirty, onOpenChange);

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
    <Modal open={open} onOpenChange={dirtyClose.handleOpenChange}>
      <ModalPortal>
        <ModalOverlay />
        <ModalContent showCloseButton size="md">
          <ModalHeader>
            <ModalTitle>{rule ? 'Edit routing rule' : 'Add routing rule'}</ModalTitle>
          </ModalHeader>
          <Form {...form}>
            <ModalBody>
              <div className="flex flex-col gap-4">
                {form.formState.errors.root && (
                  <Notice variant="error">{form.formState.errors.root.message}</Notice>
                )}
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field, fieldState }) => (
                    <Field invalid={!!fieldState.error}>
                      <FieldLabel>Referral category</FieldLabel>
                      <FieldControl>
                        <Dropdown
                          aria-label="Referral category"
                          value={field.value}
                          onValueChange={(value) => field.onChange(value ?? 'counselling')}
                          options={CATEGORY_OPTIONS}
                          invalid={!!fieldState.error}
                        />
                      </FieldControl>
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </Field>
                  )}
                />
                <FormField
                  control={form.control}
                  name="routeTo"
                  render={({ field, fieldState }) => (
                    <Field invalid={!!fieldState.error}>
                      <FieldLabel>Route referrals to</FieldLabel>
                      <FieldControl>
                        <Input placeholder="e.g. Student Counselling Unit" {...field} />
                      </FieldControl>
                      <FieldDescription>
                        A team or queue in S031, never an individual student.
                      </FieldDescription>
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </Field>
                  )}
                />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="escalateTo"
                    render={({ field, fieldState }) => (
                      <Field invalid={!!fieldState.error}>
                        <FieldLabel>Escalate to</FieldLabel>
                        <FieldControl>
                          <Input placeholder="e.g. Dean of Students Office" {...field} />
                        </FieldControl>
                        <FieldError>{fieldState.error?.message}</FieldError>
                      </Field>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="escalateAfterHours"
                    render={({ field, fieldState }) => (
                      <Field invalid={!!fieldState.error}>
                        <FieldLabel>Escalate after (hours)</FieldLabel>
                        <FieldControl>
                          <Input
                            type="number"
                            min={1}
                            max={168}
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
                  name="priority"
                  render={({ field, fieldState }) => (
                    <Field invalid={!!fieldState.error}>
                      <FieldLabel>Priority</FieldLabel>
                      <FieldControl>
                        <Dropdown
                          aria-label="Priority"
                          value={field.value}
                          onValueChange={(value) =>
                            field.onChange(value ?? ROUTING_PRIORITIES.STANDARD)
                          }
                          options={PRIORITY_OPTIONS}
                          invalid={!!fieldState.error}
                        />
                      </FieldControl>
                      <FieldDescription>
                        Crisis routes serve the always-available crisis pathway (E-01) and bypass
                        the standard queue.
                      </FieldDescription>
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </Field>
                  )}
                />
                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <Field>
                      <FieldControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          label="Active (S031 applies this rule to new referrals)"
                        />
                      </FieldControl>
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
                {rule ? 'Save changes' : 'Add rule'}
              </Button>
            </ModalFooter>
          </Form>
          {dirtyClose.dialog}
        </ModalContent>
      </ModalPortal>
    </Modal>
  );
}
