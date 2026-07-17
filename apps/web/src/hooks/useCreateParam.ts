import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router';

/**
 * Dashboard quick actions deep-link with `?new=<entity>` (see
 * constants/quickActions.ts). A screen that owns a create modal calls this
 * to open it on arrival; the param is consumed (replaced out of history) so
 * refresh and back navigation do not re-trigger the action.
 */
export function useCreateParam(entity: string, openCreate: () => void) {
  const [searchParams, setSearchParams] = useSearchParams();
  const triggered = useRef(false);

  useEffect(() => {
    if (triggered.current) return;
    if (searchParams.get('new') !== entity) return;
    triggered.current = true;
    const next = new URLSearchParams(searchParams);
    next.delete('new');
    setSearchParams(next, { replace: true });
    openCreate();
  }, [searchParams, setSearchParams, entity, openCreate]);
}
