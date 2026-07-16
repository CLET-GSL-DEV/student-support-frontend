import { ErrorPage, type ErrorPageProps } from './ErrorPage';

type NotFoundPageProps = Pick<ErrorPageProps, 'dashboardPath' | 'loginPath'>;

export function NotFoundPage({ dashboardPath, loginPath }: NotFoundPageProps) {
  return (
    <ErrorPage
      title="This page cannot be found"
      code={404}
      description="The page you are looking for may have been moved, removed, or is temporarily unavailable."
      dashboardPath={dashboardPath}
      loginPath={loginPath}
    />
  );
}
