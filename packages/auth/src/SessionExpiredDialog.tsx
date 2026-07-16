import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from '@rfdtech/components';

interface SessionExpiredDialogProps {
  open: boolean;
  message?: string | null;
  onOpenChange: (open: boolean) => void;
  onLogin?: () => void;
  /** Where "Login" navigates. Defaults to the app's own `/login`. */
  loginPath?: string;
}

const DEFAULT_MESSAGE =
  'Your session has expired due to inactivity. Please login again to continue.';

export function SessionExpiredDialog({
  open,
  message,
  onOpenChange,
  onLogin,
  loginPath = '/login',
}: SessionExpiredDialogProps) {
  // `SessionProvider` (which renders this dialog) is mounted ABOVE
  // `RouterProvider` so it renders across every route — `useNavigate()` would
  // throw ("may be used only in the context of a <Router>") since there's no
  // router ancestor here. A hard navigation is also the right call for a
  // session-expiry reset: it clears in-memory query cache / stale state
  // rather than soft-navigating with a poisoned app.
  const handleLogin = () => {
    onLogin?.();
    onOpenChange(false);
    window.location.assign(loginPath);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent>
          <DialogTitle className="mt-4!">Session Expired</DialogTitle>
          <DialogDescription>{message ?? DEFAULT_MESSAGE}</DialogDescription>
          <DialogFooter>
            <Button variant="secondary" className="w-full" onClick={handleLogin}>
              Login
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
