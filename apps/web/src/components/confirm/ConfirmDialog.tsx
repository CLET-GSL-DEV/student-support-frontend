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

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  /** Disables both buttons while the confirmed action is in flight. */
  loading?: boolean;
}

/** Shared destructive-action confirmation, per the ui-patterns Dialog
 * conventions. The caller closes the dialog when its action settles. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent>
          <div className="flex items-center gap-2">
            <CircleX className="size-5 text-error shrink-0" />
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription>{description}</DialogDescription>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" disabled={loading} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button variant="destructive" loading={loading} onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
