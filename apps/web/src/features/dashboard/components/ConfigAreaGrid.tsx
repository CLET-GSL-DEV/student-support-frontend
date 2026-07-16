import { useNavigate } from 'react-router';

import { Button, Card, CardTitle } from '@rfdtech/components';
import { ArrowRight } from 'lucide-react';

import { ADMIN_AREA_NAV } from '@/constants/adminNav';

/**
 * Entry points into every Admin Portal area (SRS §2.3 configuration areas
 * plus analytics, audit, and release governance). Static config, no data
 * dependency.
 */
export function ConfigAreaGrid() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {ADMIN_AREA_NAV.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.area} className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Icon className="size-5 text-primary shrink-0" aria-hidden />
              <CardTitle>{item.label}</CardTitle>
            </div>
            <p className="flex-1 text-sm text-foreground-muted">{item.description}</p>
            <Button
              variant="ghost"
              size="sm"
              className="w-fit"
              onClick={() => void navigate(item.route)}
            >
              Open
              <ArrowRight size={16} strokeWidth={2} aria-hidden />
            </Button>
          </Card>
        );
      })}
    </div>
  );
}
