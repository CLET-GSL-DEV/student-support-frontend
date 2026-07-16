import { Button, Notice } from '@rfdtech/components';

interface QueryErrorNoticeProps {
  title: string;
  /** Optional detail line; defaults to a generic message. */
  message?: string;
  onRetry: () => void;
}

/** Shared error state for data loads: message plus retry, per the base's
 * loading/error/empty discipline. */
export function QueryErrorNotice({ title, message, onRetry }: QueryErrorNoticeProps) {
  return (
    <Notice variant="error" title={title}>
      <div className="flex flex-col items-start gap-2">
        <p>{message ?? 'Something went wrong while loading this data.'}</p>
        <Button variant="ghost" size="sm" onClick={onRetry}>
          Try again
        </Button>
      </div>
    </Notice>
  );
}
