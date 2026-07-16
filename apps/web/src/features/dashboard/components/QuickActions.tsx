import { useState } from 'react';
import { useNavigate } from 'react-router';

import { Button, Card, CardActions, CardHeader, CardTitle } from '@rfdtech/components';
import { Pencil } from 'lucide-react';

import { ADMIN_AREA_NAV } from '@/constants/adminNav';
import { useQuickActionsStore } from '@/stores';

import { QuickActionsEditModal } from './QuickActionsEditModal';

/**
 * Editable shortcuts into the admin areas, replacing a static repeat of the
 * sidebar. The selection is a persisted per-browser preference; rendering
 * filters against the current nav config so stale entries are ignored.
 */
export function QuickActions() {
  const navigate = useNavigate();
  const areas = useQuickActionsStore((state) => state.areas);
  const setAreas = useQuickActionsStore((state) => state.setAreas);

  const [editOpen, setEditOpen] = useState(false);
  const [modalKey, setModalKey] = useState(0);

  const items = ADMIN_AREA_NAV.filter((item) => areas.includes(item.area));

  return (
    <Card className="flex flex-col gap-4">
      <CardHeader>
        <CardTitle>Quick actions</CardTitle>
        <CardActions>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setModalKey((key) => key + 1);
              setEditOpen(true);
            }}
          >
            <Pencil size={16} strokeWidth={2} aria-hidden />
            Edit
          </Button>
        </CardActions>
      </CardHeader>
      {items.length === 0 ? (
        <p className="text-sm text-foreground-muted">
          No quick actions selected. Use Edit to choose the areas you want at hand.
        </p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Button key={item.area} variant="secondary" onClick={() => void navigate(item.route)}>
                <Icon size={16} strokeWidth={2} aria-hidden />
                {item.label}
              </Button>
            );
          })}
        </div>
      )}
      <QuickActionsEditModal
        key={modalKey}
        open={editOpen}
        onOpenChange={setEditOpen}
        selected={areas}
        onSave={setAreas}
      />
    </Card>
  );
}
