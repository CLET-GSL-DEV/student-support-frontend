export type ErrorReporter = (error: Error, context?: Record<string, unknown>) => void;

// No-op by default so nothing is sent in dev/test unless an app opts in.
let reporter: ErrorReporter = () => {};

/**
 * Register an error reporter (e.g. Sentry). Call once at app startup:
 *   setErrorReporter((err, ctx) => Sentry.captureException(err, { extra: ctx }));
 */
export function setErrorReporter(fn: ErrorReporter): void {
  reporter = fn;
}

/** Report a caught error through the registered reporter. Always safe to call. */
export function reportError(error: Error, context?: Record<string, unknown>): void {
  try {
    reporter(error, context);
  } catch {
    // Never let the reporter itself crash the app.
  }
}
