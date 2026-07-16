import { useSyncExternalStore } from 'react';

function getSnapshot(query: string) {
  return window.matchMedia(query).matches;
}

function subscribe(onStoreChange: () => void, query: string) {
  const mql = window.matchMedia(query);
  mql.addEventListener('change', onStoreChange);
  return () => mql.removeEventListener('change', onStoreChange);
}

/** Subscribe to a CSS media query and re-render when it changes. SSR-safe (defaults to false). */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onStoreChange) => subscribe(onStoreChange, query),
    () => getSnapshot(query),
    () => false,
  );
}
