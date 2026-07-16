export {
  AppProviders,
  type AppProvidersAuthConfig,
  type AppProvidersSessionConfig,
} from './AppProviders';
export { ErrorBoundary } from './ErrorBoundary';
export { ErrorFallback } from './ErrorFallback';
export { PlaceholderPage } from './PlaceholderPage';
export { reportError, setErrorReporter, type ErrorReporter } from './reportError';

// Branded error/404 screens. Hosted in `@starter/auth` (they read `useAuth()`
// to decide "Go to Dashboard" vs "Go to Login", and `@starter/auth` can't
// depend back on `@starter/ui`) and re-exported here so `@starter/ui` imports
// keep working. Use `RouteErrorPage` as a router's `errorElement` and
// `NotFoundPage` for an explicit `path: '*'` route.
export {
  ErrorPage,
  type ErrorPageProps,
  RouteErrorPage,
  NotFoundPage,
  ForbiddenPage,
} from '@starter/auth';

// Shared route objects for the auth flow (login, OIDC callback, logout
// callback, forbidden) — spread into each app's `createBrowserRouter` array
// instead of hand-registering the same four routes per app.
export { GlobalAuthRoutes, type GlobalAuthRoutesConfig } from './GlobalAuthRoutes';

// Shared error surfaces — a router `errorElement` and the `path: '*'`
// catch-all — instead of retyping `RouteErrorPage`/`NotFoundPage` with the
// same dashboardPath/loginPath at every route node.
export {
  GlobalErrorRoutes,
  type GlobalErrorRoutesConfig,
  type GlobalErrorRoutesResult,
} from './GlobalErrorRoutes';

// Generic layout/shared components every app needs.
export { AppShell } from './AppShell';
export { MobileWarningLayout } from './MobileWarningLayout';
export { RoleGuard } from './RoleGuard';
export { PageSkeleton } from './PageSkeleton';
export { PageTitle } from './PageTitle';
export { DateDisplay } from './DateDisplay';
export { HeaderProfile } from './HeaderProfile';
