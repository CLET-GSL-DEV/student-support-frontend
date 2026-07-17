import { useState } from 'react';
import { useNavigate } from 'react-router';

import { Button, Card, CardActions, CardHeader, CardTitle } from '@rfdtech/components';
import { Pencil } from 'lucide-react';

import { QUICK_ACTIONS } from '@/constants/quickActions';
import { useQuickActionsStore } from '@/stores';

import { QuickActionsEditModal } from './QuickActionsEditModal';

/**
 * Editable task shortcuts: each action deep-links into its screen and, for
 * create actions, opens the create modal on arrival (via ?new=<entity>).
 * The selection is a persisted per-browser preference; rendering filters
 * against the catalog so stale entries are ignored.
 */
export function QuickActions() {
  const navigate = useNavigate();
  const actionIds = useQuickActionsStore((state) => state.actionIds);
  const setActionIds = useQuickActionsStore((state) => state.setActionIds);

  const [editOpen, setEditOpen] = useState(false);
  const [modalKey, setModalKey] = useState(0);

  const actions = QUICK_ACTIONS.filter((action) => actionIds.includes(action.id));

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
      {actions.length === 0 ? (
        <p className="text-sm text-foreground-muted">
          No quick actions selected. Use Edit to choose the tasks you want at hand.
        </p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.id}
                variant="secondary"
                onClick={() =>
                  void navigate({ pathname: action.route, search: action.search ?? '' })
                }
              >
                <Icon size={16} strokeWidth={2} aria-hidden />
                {action.label}
              </Button>
            );
          })}
        </div>
      )}
      <QuickActionsEditModal
        key={modalKey}
        open={editOpen}
        onOpenChange={setEditOpen}
        selected={actionIds}
        onSave={setActionIds}
      />
    </Card>
  );
}
