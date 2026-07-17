import { useState } from 'react';

import {
  Button,
  Checkbox,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalPortal,
  ModalTitle,
} from '@rfdtech/components';

import { QUICK_ACTIONS } from '@/constants/quickActions';

interface QuickActionsEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected: string[];
  onSave: (actionIds: string[]) => void;
}

/** Choose which tasks appear as dashboard quick actions. */
export function QuickActionsEditModal({
  open,
  onOpenChange,
  selected,
  onSave,
}: QuickActionsEditModalProps) {
  const [draft, setDraft] = useState<string[]>(selected);

  function toggle(actionId: string, checked: boolean) {
    setDraft((current) =>
      checked ? [...current, actionId] : current.filter((value) => value !== actionId),
    );
  }

  function handleSave() {
    onSave(draft);
    onOpenChange(false);
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalPortal>
        <ModalOverlay />
        <ModalContent showCloseButton size="sm">
          <ModalHeader>
            <ModalTitle>Edit quick actions</ModalTitle>
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-3">
              {QUICK_ACTIONS.map((action) => (
                <Checkbox
                  key={action.id}
                  label={action.label}
                  checked={draft.includes(action.id)}
                  onCheckedChange={(checked) => toggle(action.id, checked)}
                />
              ))}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="button" onClick={handleSave}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </ModalPortal>
    </Modal>
  );
}
