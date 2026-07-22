import { env } from '@/config/env';

/**
 * Request payload for the `send-email` Supabase Edge Function
 * (supabase/functions/send-email). Mirrors that function's contract — keep the
 * two in sync. Either `html` or `text` is required.
 */
export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  /** Overrides the function's default sender (EMAIL_FROM). Needs a verified domain. */
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string | string[];
}

export interface SendEmailResult {
  /** Resend message id. */
  id: string;
}

/**
 * Send a transactional email via the server-side Resend integration.
 *
 * The Resend API key is a secret and never reaches the browser: this POSTs to
 * the `send-email` Supabase Edge Function, which holds the key and calls Resend.
 * Set `VITE_EMAIL_FUNCTION_URL` to that function's URL (see .env.example).
 *
 * @throws when the function URL is unset, the network call fails, or the
 * function returns a non-OK response — the Error message carries the reason
 * (e.g. Resend's unverified-domain / test-mode error) for surfacing to the user.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  if (!env.emailFunctionUrl) {
    throw new Error(
      'Email is not configured: set VITE_EMAIL_FUNCTION_URL to the send-email function URL.',
    );
  }

  let response: Response;
  try {
    response = await fetch(env.emailFunctionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  } catch {
    throw new Error('Could not reach the email service.');
  }

  const body = (await response.json().catch(() => null)) as {
    ok?: boolean;
    id?: string;
    error?: string;
  } | null;

  if (!response.ok || !body?.ok) {
    throw new Error(body?.error ?? `Email send failed (HTTP ${response.status}).`);
  }

  return { id: body.id ?? '' };
}
