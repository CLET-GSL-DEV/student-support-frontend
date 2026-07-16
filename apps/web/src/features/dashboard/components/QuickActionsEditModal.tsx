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

import type { AdminArea } from '@/constants/admin';
import { ADMIN_AREA_NAV } from '@/constants/adminNav';

interface QuickActionsEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected: AdminArea[];
  onSave: (areas: AdminArea[]) => void;
}

/** Choose which admin areas appear as dashboard quick actions. */
export function QuickActionsEditModal({
  open,
  onOpenChange,
  selected,
  onSave,
}: QuickActionsEditModalProps) {
  const [draft, setDraft] = useState<AdminArea[]>(selected);

  function toggle(area: AdminArea, checked: boolean) {
    setDraft((current) =>
      checked ? [...current, area] : current.filter((value) => value !== area),
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
              {ADMIN_AREA_NAV.map((item) => (
                <Checkbox
                  key={item.area}
                  label={item.label}
                  checked={draft.includes(item.area)}
                  onCheckedChange={(checked) => toggle(item.area, checked)}
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
