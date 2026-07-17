import { useSearchParams } from 'react-router';

import {
  SectionDescription,
  SectionHeader,
  SectionTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@rfdtech/components';

import { CapabilityGate } from '@/components/capability-gate';
import { CAPABILITIES } from '@/constants/admin';

import { CategoriesTable, TemplatesTable } from '../components';

/**
 * Notification content management (SA.08; SRS §1.2, §2.3, §2.6, G-01, G-02).
 * Configuration flows to S025 and the Push Notification Service; every write
 * records to the S003 audit seam.
 */
export function Component() {
  // The "Add notification category" quick action lands on the categories
  // tab so its create modal (opened via useCreateParam) is mounted.
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('new') === 'category' ? 'categories' : 'templates';

  return (
    <CapabilityGate capability={CAPABILITIES.NOTIFICATIONS_READ}>
      <div className="flex flex-col gap-6">
        <SectionHeader>
          <SectionTitle>Notification Content</SectionTitle>
          <SectionDescription>
            Templates and categories delivered to students through SA.08. Statutory categories are
            locked against opt-out in the student app.
          </SectionDescription>
        </SectionHeader>
        <Tabs variant="pill" defaultValue={initialTab}>
          <TabsList>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>
          <TabsContent value="templates">
            <TemplatesTable />
          </TabsContent>
          <TabsContent value="categories">
            <CategoriesTable />
          </TabsContent>
        </Tabs>
      </div>
    </CapabilityGate>
  );
}
