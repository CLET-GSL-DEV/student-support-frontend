import { ErrorPage, type ErrorPageProps } from './ErrorPage';

type ForbiddenPageProps = Pick<ErrorPageProps, 'dashboardPath' | 'loginPath'>;

/** Branded 403 screen — pass as `ProtectedRoute`'s `forbiddenElement` so a
 * missing-role redirect looks like every other error surface (logo, code,
 * description, Go to Dashboard / Go Back) instead of the unstyled default. */
export function ForbiddenPage({ dashboardPath, loginPath }: ForbiddenPageProps) {
  return (
    <ErrorPage
      title="Access denied"
      code={403}
      description="You do not have permission to view this page. Contact your system administrator if you believe this is an error."
      dashboardPath={dashboardPath}
      loginPath={loginPath}
    />
  );
}
