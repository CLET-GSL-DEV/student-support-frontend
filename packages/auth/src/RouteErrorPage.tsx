import { isRouteErrorResponse, useRouteError } from 'react-router';

import { ErrorPage, type ErrorPageProps } from './ErrorPage';

type RouteErrorPageProps = Pick<ErrorPageProps, 'dashboardPath' | 'loginPath'>;

export function RouteErrorPage({ dashboardPath, loginPath }: RouteErrorPageProps) {
  const error = useRouteError();

  let title: string;
  let description: string;
  let code: string | number | undefined;

  if (isRouteErrorResponse(error)) {
    code = error.status;
    if (error.status === 404) {
      title = 'This page cannot be found';
      description =
        'The page you are looking for may have been moved, removed, or is temporarily unavailable. Your session and personal data remain secure.';
    } else {
      title = 'Something went wrong';
      description =
        'We encountered an unexpected issue. Please try again or contact support if the problem persists. Your session and personal data remain secure.';
    }
  } else if (error instanceof Error) {
    title = 'Something went wrong';
    description =
      'We encountered an unexpected issue. Your session and personal data remain secure.';
  } else {
    title = 'Something went wrong';
    description = 'An unexpected error occurred. Your session and personal data remain secure.';
  }

  return (
    <ErrorPage
      title={title}
      code={code}
      description={description}
      dashboardPath={dashboardPath}
      loginPath={loginPath}
    />
  );
}
