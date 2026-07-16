import { type ReactNode, Suspense } from 'react';
import { Outlet } from 'react-router';

import {
  AppBody,
  AppHeader,
  AppHeaderActions,
  AppHeaderBranding,
  AppLayout,
  AppSidebar,
} from '@rfdtech/components';

import { HeaderProfile } from './HeaderProfile';
import { MobileWarningLayout } from './MobileWarningLayout';
import { PageSkeleton } from './PageSkeleton';

interface AppShellProps {
  /** Portal name shown in the header branding subtitle (e.g. "Admin Portal") */
  subtitle: string;
  /** Sidebar navigation panel content */
  sidebar: ReactNode;
  /** Optional app switcher element (admin/verifier portals) */
  appSwitcher?: ReactNode;
  /** Optional notifications bell element */
  notifications?: ReactNode;
}

function useIsMobile() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(max-width: 767px)').matches;
}

/**
 * Shared app shell used by every EVS portal. Handles:
 * - Mobile warning (redirects to <MobileWarningLayout /> below 768px)
 * - Stacked layout shell (full-width header + sidebar + content)
 * - Header branding (EVS logo + portal name)
 * - Header actions (app switcher, notifications, profile — theme toggle is
 *   built into ProfilePopover, no hand-rolled header button needed)
 * - Sidebar with app-specific nav
 * - Suspense-wrapped `<Outlet />` for page content
 */
export function AppShell({ subtitle, sidebar, appSwitcher, notifications }: AppShellProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileWarningLayout />;
  }

  return (
    <AppLayout variant="stacked">
      <AppHeader variant="plain">
        <AppHeaderBranding
          logo={<img src="/evs-logo.png" alt="" width={28} height={28} />}
          title="EVS"
          subtitle={subtitle}
        />
        <AppHeaderActions>
          {appSwitcher}
          {notifications}
          <HeaderProfile />
        </AppHeaderActions>
      </AppHeader>
      <AppSidebar>{sidebar}</AppSidebar>
      <AppBody>
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
      </AppBody>
    </AppLayout>
  );
}
