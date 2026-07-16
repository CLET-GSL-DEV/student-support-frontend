import { Card, CardHeader, CardTitle, ProgressBar } from '@rfdtech/components';

export interface DistributionRow {
  key: string;
  label: string;
  value: number;
}

interface DistributionCardProps {
  title: string;
  rows: DistributionRow[];
  /** Unit suffix for the row values, e.g. "sessions" or "delivered". */
  unit: string;
}

const numberFormat = new Intl.NumberFormat('en-GH');

/**
 * Aggregate distribution list: one ProgressBar per row, scaled to the
 * largest value. Counts only; nothing student-identifiable ever renders
 * here (SRS §2.3, §2.6).
 */
export function DistributionCard({ title, rows, unit }: DistributionCardProps) {
  const max = Math.max(...rows.map((row) => row.value), 1);

  return (
    <Card className="flex flex-col gap-4">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <ul className="flex flex-col gap-3">
        {rows.map((row) => (
          <li key={row.key} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-medium text-foreground">{row.label}</span>
              <span className="text-xs text-foreground-muted">
                {numberFormat.format(row.value)} {unit}
              </span>
            </div>
            <ProgressBar
              value={row.value}
              max={max}
              size="sm"
              aria-label={`${row.label}: ${numberFormat.format(row.value)} ${unit}`}
            />
          </li>
        ))}
      </ul>
    </Card>
  );
}
