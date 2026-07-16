import { useLocation } from 'react-router';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarItem,
  SidebarLink,
  SidebarNav,
} from '@rfdtech/components';
import { LayoutDashboard } from 'lucide-react';

import { ROUTES } from '@/constants/routes';

/**
 * Fixed literal nav array — this app owns a single role, so it doesn't need
 * `admin-portal`'s role-filtered nav machinery (see the `architecture`
 * skill's routing/nav notes). Add items here as the app grows.
 */
export function MainSidebarPanel() {
  const location = useLocation();

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarNav>
          <SidebarGroup>
            <SidebarItem>
              <SidebarLink
                to={ROUTES.DASHBOARD}
                icon={<LayoutDashboard size={18} strokeWidth={1.5} />}
                active={location.pathname === ROUTES.DASHBOARD || location.pathname === ROUTES.HOME}
              >
                Dashboard
              </SidebarLink>
            </SidebarItem>
          </SidebarGroup>
        </SidebarNav>
      </SidebarContent>
    </Sidebar>
  );
}
