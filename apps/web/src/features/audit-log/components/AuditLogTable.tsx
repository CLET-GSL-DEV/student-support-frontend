import { useMemo, useState } from 'react';

import {
  Badge,
  DateRangeSelector,
  type DateRangeValue,
  Dropdown,
  Table,
  type TableColumn,
  TableContent,
  TableFilter,
  TableHeader,
} from '@rfdtech/components';
import { useQuery } from '@tanstack/react-query';
import { ScrollText } from 'lucide-react';

import { formatDate } from '@starter/utils';

import { auditKeys } from '@/api/audit';
import { QueryErrorNotice } from '@/components/query-error';
import { ADMIN_AREAS, ADMIN_AREA_LABELS, type AdminArea } from '@/constants/admin';
import { auditRepository } from '@/data/audit';
import type { AuditEvent, AuditListQuery } from '@/types/audit';

interface AuditFilters {
  area: AdminArea | null;
  range: DateRangeValue;
}

const EMPTY_FILTERS: AuditFilters = { area: null, range: { start: null, end: null } };

const AREA_OPTIONS = Object.values(ADMIN_AREAS).map((area) => ({
  value: area,
  label: ADMIN_AREA_LABELS[area],
}));

function toQuery(filters: AuditFilters): AuditListQuery {
  const { start, end } = filters.range;
  const endOfDay = end
    ? new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999)
    : null;
  return {
    area: filters.area ?? undefined,
    from: start?.toISOString(),
    to: endOfDay?.toISOString(),
  };
}

/**
 * Read-only browse over the S003 audit seam (SRS §5.1): every configuration
 * change and app release event, filterable by area and date.
 * // TODO(integration): S003 Audit.
 */
export function AuditLogTable() {
  const [draft, setDraft] = useState<AuditFilters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<AuditFilters>(EMPTY_FILTERS);

  const query = toQuery(applied);
  const events = useQuery({
    queryKey: [...auditKeys.lists(), query.area ?? 'all', query.from ?? '', query.to ?? ''],
    queryFn: () => auditRepository.list(query),
  });

  const columns = useMemo<TableColumn<AuditEvent>[]>(
    () => [
      {
        id: 'occurredAt',
        header: 'When',
        width: 180,
        accessorFn: (event) =>
          formatDate(new Date(event.occurredAt), { dateStyle: 'medium', timeStyle: 'short' }),
      },
      {
        id: 'area',
        header: 'Area',
        width: 170,
        accessorFn: (event) => (
          <Badge variant="outline" size="sm">
            {ADMIN_AREA_LABELS[event.area]}
          </Badge>
        ),
      },
      { id: 'summary', header: 'Change', accessorKey: 'summary' },
      { id: 'actor', header: 'By', width: 220, accessorKey: 'actor' },
    ],
    [],
  );

  if (events.isError) {
    return <QueryErrorNotice title="Audit log unavailable" onRetry={() => void events.refetch()} />;
  }

  return (
    <Table paramPrefix="audit-log">
      <TableHeader>
        <TableFilter
          variant="spread"
          onApply={() => setApplied(draft)}
          onReset={() => {
            setDraft(EMPTY_FILTERS);
            setApplied(EMPTY_FILTERS);
          }}
        >
          <Dropdown
            aria-label="Filter by area"
            value={draft.area}
            onValueChange={(value) => setDraft({ ...draft, area: (value as AdminArea) ?? null })}
            options={AREA_OPTIONS}
            placeholder="All areas"
          />
          <DateRangeSelector
            value={draft.range}
            onChange={(range) => setDraft({ ...draft, range })}
            placeholder="Any date"
          />
        </TableFilter>
      </TableHeader>
      <TableContent
        variant="panel"
        columns={columns}
        data={events.data ?? []}
        rowKey={(event) => event.id}
        loading={events.isLoading}
        loadingRows={6}
        emptyIcon={<ScrollText size={20} strokeWidth={2} aria-hidden />}
        emptyText="No configuration changes match these filters"
      />
    </Table>
  );
}
