import { useState } from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  ProfilePopover,
  RoleSelect,
} from '@rfdtech/components';
import type { Role } from '@rfdtech/components';
import {
  Building2,
  ClipboardCheck,
  Crown,
  FileCheck,
  GraduationCap,
  LogOut,
  ScrollText,
  Search,
  Shield,
} from 'lucide-react';

import {
  GLOBAL_ROUTES,
  PORTALS,
  formatRoleLabel,
  isKnownRole,
  useAuth,
  useSessionStore,
} from '@starter/auth';

const ROLE_ICONS: Record<string, typeof Shield> = {
  system_administration: Shield,
  system_administrator: Shield,
  institution_officer: Building2,
  auditor: ScrollText,
  registrar: FileCheck,
  verification_officer: Search,
  verifier: Search,
  internal_assessor: ClipboardCheck,
  gtec_assessor: ClipboardCheck,
  candidate: GraduationCap,
  director_general: Crown,
};

export function HeaderProfile() {
  const { signoutRedirect } = useAuth();
  const user = useSessionStore((s) => s.user);
  const activeRole = useSessionStore((s) => s.activeRole);
  const setActiveRole = useSessionStore((s) => s.setActiveRole);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!user) return null;

  function handleSignOut() {
    setConfirmOpen(false);
    void signoutRedirect();
  }

  const initials = user.displayName
    ? user.displayName
        .split(' ')
        .map((s) => s[0])
        .join('')
        .slice(0, 2)
    : '';

  const roles: Role[] = user.roles.map((r) => {
    const Icon = ROLE_ICONS[r.role] ?? Shield;
    return {
      id: r.role,
      name: formatRoleLabel(r.role),
      icon: <Icon size={16} strokeWidth={1.5} />,
    };
  });

  /**
   * A role either lives on this same portal origin (multi-role portal, e.g.
   * accessor-portal's Internal Assessor / GTEC Assessor) — just flip the
   * locally-displayed role — or on another portal entirely, which needs a
   * hard cross-origin navigation to that portal's own `/login`. Landing
   * there while the ZITADEL IdP session is still active triggers an
   * automatic sign-in (see `LoginScreen`'s `?switch=1` handling) that lands
   * the user on that portal's own dashboard, no credentials re-entry needed.
   */
  function handleRoleClick(role: Role) {
    if (!isKnownRole(role.id)) return;
    const target = PORTALS[role.id];
    if (target.url !== window.location.origin) {
      window.location.href = `${target.url}${GLOBAL_ROUTES.LOGIN}?switch=1`;
      return;
    }
    setActiveRole(role.id);
  }

  return (
    <>
      <ProfilePopover
        user={{
          name: user.displayName,
          email: user.email,
          role: formatRoleLabel(activeRole ?? user.roles.at(0)?.role ?? ''),
          initials,
        }}
        variant="avatar"
        onSignOut={() => {
          setConfirmOpen(true);
        }}
      >
        <RoleSelect
          roles={roles}
          selectedRole={activeRole ?? roles[0]?.id}
          onClickRole={handleRoleClick}
          noConfirm
        />
      </ProfilePopover>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogTitle>Sign out?</DialogTitle>
          <DialogDescription>
            You&apos;ll need to sign in again to access the portal.
          </DialogDescription>
          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="ghost"
              onClick={() => {
                setConfirmOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleSignOut}>
              <LogOut className="size-4" />
              Sign out
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
