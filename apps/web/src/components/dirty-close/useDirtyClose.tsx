import { type ReactNode, useState } from 'react';

import { ConfirmDialog } from '@/components/confirm';

interface DirtyClose {
  /** Use as the modal's onOpenChange and for the Cancel button's close. */
  handleOpenChange: (open: boolean) => void;
  /** Mount inside the modal content; renders the discard confirmation. */
  dialog: ReactNode;
}

/**
 * Dirty-close guard for form modals: closing with unsaved changes asks for
 * confirmation instead of discarding silently, completing the shared
 * unsaved-changes discipline for modal-scoped editing. Successful submits
 * should call the underlying onOpenChange directly; a saved form has
 * nothing left to guard.
 */
export function useDirtyClose(isDirty: boolean, onOpenChange: (open: boolean) => void): DirtyClose {
  const [confirming, setConfirming] = useState(false);

  function handleOpenChange(open: boolean) {
    if (!open && isDirty) {
      setConfirming(true);
      return;
    }
    onOpenChange(open);
  }

  const dialog = (
    <ConfirmDialog
      open={confirming}
      onOpenChange={setConfirming}
      title="Discard unsaved changes?"
      description="This form has changes that have not been saved. Closing it will discard them."
      confirmLabel="Discard changes"
      onConfirm={() => {
        setConfirming(false);
        onOpenChange(false);
      }}
    />
  );

  return { handleOpenChange, dialog };
}
