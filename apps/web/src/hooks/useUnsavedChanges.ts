import { useEffect } from 'react';
import { type Blocker, useBlocker } from 'react-router';

/**
 * Shared unsaved-changes pattern: blocks in-app navigation while a form is
 * dirty (render the returned blocker through UnsavedChangesDialog) and warns
 * on hard reload/close via beforeunload. Every configuration screen with a
 * form uses this pair.
 */
export function useUnsavedChanges(hasUnsavedChanges: boolean): Blocker {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [hasUnsavedChanges]);

  return blocker;
}
