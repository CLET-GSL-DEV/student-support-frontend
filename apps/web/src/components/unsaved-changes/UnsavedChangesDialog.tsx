import type { Blocker } from 'react-router';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from '@rfdtech/components';
import { TriangleAlert } from 'lucide-react';

interface UnsavedChangesDialogProps {
  blocker: Blocker;
}

/**
 * Confirmation dialog for the shared unsaved-changes pattern; pair with
 * useUnsavedChanges. Stay keeps the user on the dirty form; Discard proceeds
 * with the blocked navigation.
 */
export function UnsavedChangesDialog({ blocker }: UnsavedChangesDialogProps) {
  const open = blocker.state === 'blocked';

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) blocker.reset?.();
      }}
    >
      <DialogPortal>
        <DialogOverlay />
        <DialogContent>
          <div className="flex items-center gap-2">
            <TriangleAlert className="size-5 text-warning shrink-0" />
            <DialogTitle>Discard unsaved changes?</DialogTitle>
          </div>
          <DialogDescription>
            You have configuration changes that have not been saved. Leaving this screen will
            discard them.
          </DialogDescription>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => blocker.reset?.()}>
              Stay
            </Button>
            <Button variant="destructive" onClick={() => blocker.proceed?.()}>
              Discard changes
            </Button>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
