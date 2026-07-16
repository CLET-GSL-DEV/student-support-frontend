import { Loader2 } from 'lucide-react';

export function PageSkeleton() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="size-8 animate-spin text-foreground-muted" />
        <span className="text-sm text-foreground-muted">Loading...</span>
      </div>
    </div>
  );
}
