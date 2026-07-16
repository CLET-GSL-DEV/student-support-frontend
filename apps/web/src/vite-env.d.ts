/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_IAM_URL: string;
  readonly VITE_APP_ENV: 'development' | 'staging' | 'production';
  readonly VITE_SENTRY_DSN: string;
  readonly VITE_SESSION_CHECK_ENABLED: 'true' | 'false';
  readonly VITE_ZITADEL_AUTHORITY: string;
  readonly VITE_ZITADEL_CLIENT_ID: string;
  readonly VITE_ZITADEL_REDIRECT_URI: string;
  readonly VITE_ZITADEL_POST_LOGOUT_URI: string;
  readonly VITE_ZITADEL_PROJECT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
