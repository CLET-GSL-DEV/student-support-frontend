import { useLocation } from 'react-router';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarItem,
  SidebarLink,
  SidebarNav,
} from '@rfdtech/components';
import { LayoutDashboard } from 'lucide-react';

import { CONFIG_AREA_NAV, OVERSIGHT_AREA_NAV } from '@/constants/adminNav';
import { ROUTES } from '@/constants/routes';

/**
 * Admin Portal navigation: the SRS §2.3 configuration areas plus the
 * analytics, audit, and release-governance surfaces. Single-role portal, so
 * the nav is a fixed literal config (see constants/adminNav.ts), no
 * role-filtering machinery.
 */
export function MainSidebarPanel() {
  const location = useLocation();

  return (
    <Sidebar variant="plain">
      <SidebarContent>
        <SidebarNav>
          <SidebarGroup collapsible defaultExpanded>
            <SidebarGroupLabel>Main</SidebarGroupLabel>
            <SidebarItem>
              <SidebarLink
                to={ROUTES.DASHBOARD}
                icon={<LayoutDashboard size={18} strokeWidth={1.5} />}
                active={location.pathname === ROUTES.DASHBOARD || location.pathname === ROUTES.HOME}
              >
                Dashboard
              </SidebarLink>
            </SidebarItem>
            {CONFIG_AREA_NAV.map((item) => {
              const Icon = item.icon;
              return (
                <SidebarItem key={item.area}>
                  <SidebarLink
                    to={item.route}
                    icon={<Icon size={18} strokeWidth={1.5} />}
                    active={location.pathname.startsWith(item.route)}
                  >
                    {item.label}
                  </SidebarLink>
                </SidebarItem>
              );
            })}
          </SidebarGroup>
          <SidebarGroup collapsible>
            <SidebarGroupLabel>Oversight</SidebarGroupLabel>
            {OVERSIGHT_AREA_NAV.map((item) => {
              const Icon = item.icon;
              return (
                <SidebarItem key={item.area}>
                  <SidebarLink
                    to={item.route}
                    icon={<Icon size={18} strokeWidth={1.5} />}
                    active={location.pathname.startsWith(item.route)}
                  >
                    {item.label}
                  </SidebarLink>
                </SidebarItem>
              );
            })}
          </SidebarGroup>
        </SidebarNav>
      </SidebarContent>
    </Sidebar>
  );
}
