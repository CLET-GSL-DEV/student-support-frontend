import { AppShell } from '@starter/ui';

import { MainSidebarPanel } from './MainSidebarPanel';

export function MainLayout() {
  return <AppShell subtitle="Web" sidebar={<MainSidebarPanel />} />;
}
