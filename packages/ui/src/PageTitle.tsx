import type { ReactNode } from 'react';

import { SectionActions, SectionHeader, SectionTitle } from '@rfdtech/components';

interface PageTitleProps {
  title: string;
  children?: ReactNode;
}

export function PageTitle({ title, children }: PageTitleProps) {
  return (
    <SectionHeader>
      <SectionTitle>{title}</SectionTitle>
      {children && <SectionActions>{children}</SectionActions>}
    </SectionHeader>
  );
}
