export { GLOBAL_ROUTES } from './GLOBAL_ROUTES';
export { GslAuthProvider } from './GslAuthProvider';
export { AuthTokenBridge } from './AuthTokenBridge';
export { ProtectedRoute } from './ProtectedRoute';
export { AuthCallback, LogoutCallback, RETURN_TO_KEY } from './callbacks';
export { useAuth } from './useAuth';
export { buildAuthConfig, type ZitadelEnv } from './config';
export { createIamClient, type IamEnv } from './iamClient';

// Branded error/404 screens. Live here (not `@starter/ui`) because they read
// `useAuth()` to decide "Go to Dashboard" vs "Go to Login" — `@starter/ui`
// depends on `@starter/auth`, not the other way around, so anything `useAuth`
// touches has to be hosted here to avoid a circular workspace dependency.
// `@starter/ui`'s `GlobalAuthRoutes`/`GlobalErrorRoutes` re-export these.
export { ErrorPage, type ErrorPageProps } from './ErrorPage';
export { ForbiddenPage } from './ForbiddenPage';
export { RouteErrorPage } from './RouteErrorPage';
export { NotFoundPage } from './NotFoundPage';

export { LoginScreen } from './LoginScreen';
export {
  ROLES,
  ROLE_TYPE,
  type ParsedRole,
  isKnownRole,
  normalizeRoles,
  resolveRoleCode,
  resolvePreferredRole,
  expandRoleAliases,
  formatRoleLabel,
} from './roles';
export { AccessGate } from './AccessGate';
export { AccessRestrictedDialog } from './AccessRestrictedDialog';

export { useSessionStore, type SessionUser } from './sessionStore';
export { useAssignedInstitution, type AssignedInstitution } from './useAssignedInstitution';
export {
  meEndpoint,
  sessionKeys,
  mapIamMeResponse,
  type IamMeResponse,
  type IamMeRole,
} from './session-api';
export { useSessionPoller, type UseSessionPollerOptions } from './useSessionPoller';
export { SessionExpiredDialog } from './SessionExpiredDialog';
export { SessionProvider } from './SessionProvider';

export { PORTALS } from './portals';
export { useRoleBasedRedirect } from './hooks/useRoleBasedRedirect';
export { RoleBasedRedirectWatcher } from './RoleBasedRedirectWatcher';

export { myAppsEndpoint, meAppsKeys, type IamApp } from './me-apps-api';
export { useMyApps } from './useMyApps';
