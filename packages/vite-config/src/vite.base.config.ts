import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import path from 'node:path';
import {
  type ConfigEnv,
  type Plugin,
  type UserConfig,
  defineConfig,
  loadEnv,
  mergeConfig,
} from 'vite';
import svgr from 'vite-plugin-svgr';

export interface AppConfigOptions {
  /** App root — pass `import.meta.dirname`. Drives the `@` alias. */
  root: string;
  /** Dev server port. */
  port?: number;
  /**
   * Opt-in: run React Compiler via a separate rolldown-babel plugin
   * (`@rolldown/plugin-babel` + `babel-plugin-react-compiler`, both already
   * deps of this package). Off by default.
   */
  reactCompiler?: boolean;
  /**
   * Opt-in: manual react/ui/lottie chunk groups plus the @rfdtech theme-compat
   * transform. Off by default; only meaningful on rolldown-vite.
   */
  chunkSplitting?: boolean;
  /** Env-aware config merged on top of the base via vite's mergeConfig. */
  extend?: (env: ConfigEnv) => UserConfig;
}

/**
 * @rfdtech/components ships a raw Tailwind `@theme` block in its prebuilt CSS,
 * which Tailwind doesn't compile (the app's own @theme in index.css provides
 * the utility mapping). Rewrite it to :root so lightningcss can minify; the
 * custom-property definitions are equivalent.
 */
function rfdtechThemeCompat(): Plugin {
  return {
    name: 'rfdtech-theme-compat',
    transform(code, id) {
      if (id.includes('@rfdtech') && id.includes('.css') && code.includes('@theme')) {
        return { code: code.replace(/@theme\s*\{/g, ':root{'), map: null };
      }
    },
  };
}

/**
 * Shared Vite config for GSL apps. Returns a config function so per-app
 * `extend` callbacks can read the resolved env (mode/command).
 */
export function createAppConfig(options: AppConfigOptions) {
  const { root, port = 5173, reactCompiler = false, chunkSplitting = false, extend } = options;

  return defineConfig((env) => {
    // Dev-only reverse proxy: when the app's service base URLs (e.g.
    // `VITE_API_URL` / `VITE_IAM_URL`) are /-relative, the API clients call
    // same-origin `/api/*`, and Vite forwards those to the real gateway here.
    // This sidesteps the gateway's missing CORS headers
    // for browser calls (e.g. IAM `/api/iam/v1/*`). `changeOrigin` rewrites the
    // Host so the upstream sees its own origin. Ignored in production builds;
    // there the app is served same-origin behind the gateway. Target is
    // overridable via `VITE_DEV_API_PROXY_TARGET`.
    const devEnv = loadEnv(env.mode, process.cwd(), '');
    const proxyTarget =
      (devEnv.VITE_DEV_API_PROXY_TARGET ?? '').trim() || 'http://178.105.154.224:8000';

    const base: UserConfig = {
      plugins: [
        react(),
        // The installed @vitejs/plugin-react (v6, oxc-based) dropped the old
        // `babel` option; React Compiler now runs as a separate rolldown-babel
        // plugin via `reactCompilerPreset`.
        ...(reactCompiler ? [babel({ presets: [reactCompilerPreset()] })] : []),
        tailwindcss(),
        svgr({ svgrOptions: { icon: true } }),
        ...(chunkSplitting ? [rfdtechThemeCompat()] : []),
      ],
      resolve: {
        alias: { '@': path.resolve(root, 'src') },
      },
      server: {
        port,
        proxy: {
          '/api': {
            target: proxyTarget,
            changeOrigin: true,
            secure: false,
          },
        },
      },
      build: {
        // Source maps aid production debugging/observability without leaking source.
        sourcemap: true,
        ...(chunkSplitting
          ? {
              // ui-vendor is @rfdtech/components' single prebuilt module — it
              // cannot be split further and is cached across routes.
              chunkSizeWarningLimit: 950,
              rolldownOptions: {
                // lottie-web (inside @rfdtech/components) uses direct eval; not ours to fix.
                checks: { eval: false },
                output: {
                  codeSplitting: {
                    groups: [
                      {
                        name: 'react-vendor',
                        test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/,
                      },
                      {
                        name: 'ui-vendor',
                        test: /node_modules[\\/]@rfdtech[\\/]/,
                      },
                      {
                        name: 'lottie',
                        test: /node_modules[\\/]lottie-web[\\/]/,
                      },
                    ],
                  },
                },
              },
            }
          : {}),
      },
    };

    return extend ? mergeConfig(base, extend(env)) : base;
  });
}
