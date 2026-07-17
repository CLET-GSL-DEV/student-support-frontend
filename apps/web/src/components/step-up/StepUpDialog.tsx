import { useState } from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  OtpInput,
} from '@rfdtech/components';
import { ShieldCheck } from 'lucide-react';

import { mockDelay } from '@/data/support';
import { useStepUpStore } from '@/stores';

const TOTP_LENGTH = 6;

interface StepUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a successful verification, once elevation is recorded. */
  onVerified: () => void;
}

/**
 * TOTP step-up prompt for sensitive and governance actions (SRS CON-G1,
 * §2.3). Verification is mocked: any 6-digit code is accepted.
 * // TODO(integration): S001 IAM; verify the code against IAM's TOTP step-up
 * endpoint and only elevate on its confirmation.
 */
export function StepUpDialog({ open, onOpenChange, onVerified }: StepUpDialogProps) {
  const elevate = useStepUpStore((state) => state.elevate);
  const [code, setCode] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [verifying, setVerifying] = useState(false);

  function resetLocalState() {
    setCode('');
    setInvalid(false);
    setVerifying(false);
  }

  async function handleVerify(candidate: string) {
    if (!new RegExp(`^\\d{${TOTP_LENGTH}}$`).test(candidate)) {
      setInvalid(true);
      return;
    }
    setVerifying(true);
    await mockDelay();
    elevate();
    resetLocalState();
    onOpenChange(false);
    onVerified();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) resetLocalState();
        onOpenChange(nextOpen);
      }}
    >
      <DialogPortal>
        <DialogOverlay />
        <DialogContent>
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary shrink-0" />
            <DialogTitle>Verification required</DialogTitle>
          </div>
          <DialogDescription>
            This action requires step-up verification. Enter the 6-digit code from your
            authenticator app to continue.
          </DialogDescription>
          <OtpInput
            length={TOTP_LENGTH}
            value={code}
            invalid={invalid}
            disabled={verifying}
            onChange={(value) => {
              setCode(value);
              setInvalid(false);
            }}
            onComplete={(value) => void handleVerify(value)}
            aria-label="One-time verification code"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" disabled={verifying} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={verifying}
              disabled={code.length < TOTP_LENGTH}
              onClick={() => void handleVerify(code)}
            >
              Verify
            </Button>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
