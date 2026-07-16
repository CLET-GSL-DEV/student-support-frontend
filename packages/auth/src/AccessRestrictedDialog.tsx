import { useNavigate } from 'react-router';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from '@rfdtech/components';
import { CircleX } from 'lucide-react';

interface AccessRestrictedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** True for an in-place action (e.g. a gated button) — shows "Cancel" instead
   * of navigating away, since there's no page to leave. */
  isAction?: boolean;
  /** Where "Return to Dashboard" navigates. Defaults to the app root. */
  homePath?: string;
}

export function AccessRestrictedDialog({
  open,
  onOpenChange,
  isAction = false,
  homePath = '/',
}: AccessRestrictedDialogProps) {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent>
          <div className="flex items-center gap-2">
            <CircleX className="size-5 shrink-0 text-error" />
            <DialogTitle>Access Restricted</DialogTitle>
          </div>
          <DialogDescription>
            You do not have the required permissions to access this section. Please contact your
            system administrator if you believe this is an error.
          </DialogDescription>
          <div className="flex justify-end gap-2">
            {isAction ? (
              <Button
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                }}
              >
                Cancel
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={() => {
                  onOpenChange(false);
                  void navigate(homePath);
                }}
              >
                Return to Dashboard
              </Button>
            )}
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
