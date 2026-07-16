import { memo } from 'react';

import { format, parseISO } from 'date-fns';
import { Calendar, Clock } from 'lucide-react';

import { cn } from '@starter/utils';

interface DateDisplayClassNames {
  root?: string;
  date?: string;
  dateIcon?: string;
  time?: string;
  timeIcon?: string;
}

interface DateDisplayProps {
  value: string | null;
  showTime?: boolean;
  noIcons?: boolean;
  classNames?: DateDisplayClassNames;
}

export const DateDisplay = memo(function DateDisplay({
  value,
  showTime = false,
  noIcons = false,
  classNames = {},
}: DateDisplayProps) {
  if (!value) return <span className="text-foreground-muted">&mdash;</span>;

  const date = parseISO(value);

  return (
    <div className={cn('flex flex-col gap-0.5 leading-tight', classNames.root)}>
      <span
        className={cn('inline-flex items-center gap-1.5 text-sm text-foreground', classNames.date)}
      >
        {!noIcons && (
          <Calendar
            className={cn('size-3.5 text-foreground-muted shrink-0', classNames.dateIcon)}
          />
        )}
        {format(date, 'dd MMM yyyy')}
      </span>
      {showTime && (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 text-xs text-foreground-muted',
            classNames.time,
          )}
        >
          {!noIcons && (
            <Clock
              className={cn('size-3 text-foreground-muted/60 shrink-0', classNames.timeIcon)}
            />
          )}
          {format(date, 'HH:mm a')}
        </span>
      )}
    </div>
  );
});
