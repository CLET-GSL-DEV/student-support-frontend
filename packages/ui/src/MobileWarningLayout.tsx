import { Card } from '@rfdtech/components';
import { TabletSmartphone, TriangleAlert } from 'lucide-react';

export function MobileWarningLayout() {
  return (
    <div className="min-h-screen bg-surface-subtle flex p-4 relative overflow-hidden">
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="flex-[0.5]" />
        <div className="flex-[2] min-w-full flex flex-col items-center justify-center">
          <div className="flex flex-col items-center justify-center">
            <img src="/evs-logo.png" alt="EVS" className="size-28 mx-auto" />
            <span className="text-xl font-bold text-foreground/50">EVS</span>
          </div>

          <Card className="flex-1 w-full translate-y-10 pt-20! text-center relative">
            <h1 className="flex items-center justify-center gap-1 text-xl font-bold text-foreground mb-3">
              Larger Screen Required
              <TriangleAlert className="opacity-80" />
            </h1>
            <p className="text-sm text-foreground-muted leading-relaxed max-w-xs mx-auto">
              The EVS platform is best viewed on a tablet or desktop. Please switch to a larger
              device for the full experience.
            </p>

            <TabletSmartphone className="absolute left-1/2 -translate-x-1/2 bottom-12 size-32 text-foreground-muted/10" />
          </Card>
        </div>
      </div>
    </div>
  );
}
