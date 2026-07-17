import { useNavigate } from 'react-router';

import { Button } from '@rfdtech/components';
import { ArrowLeft, TriangleAlert } from 'lucide-react';

import { useAuth } from './useAuth';

export interface ErrorPageProps {
  title: string;
  code?: string | number;
  description?: string;
  dashboardPath?: string;
  loginPath?: string;
}

export function ErrorPage({
  title,
  code,
  description,
  dashboardPath = '/dashboard',
  loginPath = '/login',
}: ErrorPageProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const onGoBackClicked = () => {
    window.history.back();
  };

  const onGoToClicked = () => {
    void navigate(isAuthenticated ? dashboardPath : loginPath);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background" role="alert">
      <main className="flex flex-1 p-4">
        <div className="relative flex flex-1 items-center justify-center rounded-2xl bg-card p-4">
          <div className="relative w-4xl">
            <div className="flex flex-col gap-8 w-[240px]">
              <img
                src="/clet_logo.png"
                alt="GSL Student Support"
                className="scale-[1.1] translate-x-[-5%] h-auto aspect-square  opacity-10"
              />
              {code && (
                <h1 className="-ml-2 text-[120px] font-bold leading-none text-foreground/10 select-none">
                  {code}
                </h1>
              )}
            </div>
            <div className="flex items-center gap-4">
              <h2 className="text-3xl font-semibold text-foreground">{title}</h2>
              <TriangleAlert className="inline-flex size-[30px] text-foreground/80" />
            </div>

            {description && (
              <p className="text-base mt-4 text-foreground-secondary">{description}</p>
            )}

            <div className="mt-12 flex justify-end gap-3">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button variant="secondary" onClick={onGoToClicked}>
                  {isAuthenticated ? 'Go to Dashboard' : 'Go to Login'}
                </Button>
                <Button variant="primary" onClick={onGoBackClicked}>
                  <ArrowLeft className="size-4" />
                  Go Back
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
