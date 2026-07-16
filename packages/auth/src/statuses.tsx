import type { ReactNode } from 'react';

/**
 * Full-height centered message used for transient loading states during the
 * auth flow (signing in, completing the OIDC callback). Not an error state —
 * actual 403/auth-error screens use the branded `ForbiddenPage`/`ErrorPage`.
 */
export function CenteredMessage({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8 text-gray-600">
      <p className="text-sm">{children}</p>
    </div>
  );
}
