import type { ReactNode } from 'react';

import { Notice } from '@rfdtech/components';
import { ShieldAlert } from 'lucide-react';

import { type AdminCapability } from '@/constants/admin';
import { useAdminSession } from '@/hooks/useAdminSession';

interface CapabilityGateProps {
  capability: AdminCapability;
  children: ReactNode;
}

/**
 * Least-privilege screen gate (SRS §2.3): renders its children only when the
 * signed-in administrator holds the required capability. Route-level role
 * gating stays with ProtectedRoute; this adds the per-area layer so
 * tightening access later is a ROLE_CAPABILITIES change, not a UI change.
 */
export function CapabilityGate({ capability, children }: CapabilityGateProps) {
  const session = useAdminSession();

  if (!session.can(capability)) {
    return (
      <Notice
        variant="warning"
        title="Access restricted"
        icon={<ShieldAlert size={18} strokeWidth={2} aria-hidden />}
      >
        Your account does not hold the capability required for this area. Access is least-privilege
        per SRS 2.3; contact a system administrator if you believe this is wrong.
      </Notice>
    );
  }

  return <>{children}</>;
}
