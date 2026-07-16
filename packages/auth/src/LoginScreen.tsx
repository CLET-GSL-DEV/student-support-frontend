import { useEffect, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router';

import { Button } from '@rfdtech/components';

import './LoginScreen.css';
import { RETURN_TO_KEY } from './callbacks';
import { CenteredMessage } from './statuses';
import { useAuth } from './useAuth';

interface LocationState {
  from?: { pathname: string };
}

interface LoginScreenProps {
  /** Small caps label over the hero image (e.g. the council/org name). */
  eyebrow?: string;
  /** Big heading over the hero image (the system's own name). */
  tagline?: string;
  /** Heading above the sign-in panel's description. */
  heading?: string;
  description?: string;
  ctaLabel?: string;
  returnTo?: string;
}

export function LoginScreen({
  eyebrow = 'CLET Examination Verification System',
  tagline = 'Examination Verification System',
  heading = 'Sign in to your account',
  description = 'Secure, access to LLB Examination verification and Verification of candidate credentials.',
  ctaLabel = 'Sign in to EVS Portal',
  returnTo = '/',
}: LoginScreenProps) {
  const auth = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const from = (location.state as LocationState | null)?.from?.pathname ?? returnTo;

  const handleLogin = () => {
    sessionStorage.setItem(RETURN_TO_KEY, from);
    void auth.signinRedirect();
  };

  // Cross-portal role switch (see @starter/ui's HeaderProfile): the target
  // portal's own ZITADEL client still needs its own code exchange even
  // though the IdP session is already active, so auto-launch it instead of
  // waiting for a redundant manual click.
  const autoSwitch = searchParams.get('switch') === '1';
  const switching = useRef(false);
  useEffect(() => {
    if (autoSwitch && !auth.isLoading && !switching.current) {
      switching.current = true;
      handleLogin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSwitch, auth.isLoading]);

  if (autoSwitch) return <CenteredMessage>Switching role…</CenteredMessage>;

  return (
    <div className="landing">
      <div className="landing__media">
        <div className="landing__caption">
          <p className="landing__eyebrow">{eyebrow}</p>
          <h2 className="landing__title">{tagline}</h2>
        </div>
      </div>

      <div className="landing__panel">
        <div className="landing__content">
          <img
            className="landing__logo"
            src="/evs-logo.png"
            alt="CLET Examination Verification Portal"
          />

          <h1 className="landing__heading">{heading}</h1>
          <p className="landing__desc">{description}</p>

          <Button
            variant="primary"
            size="lg"
            className="landing__signin w-full"
            onClick={handleLogin}
            loading={auth.isLoading}
            loadingLabel=" "
          >
            {!auth.isLoading && ctaLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
