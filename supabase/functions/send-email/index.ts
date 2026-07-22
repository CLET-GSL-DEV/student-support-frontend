// send-email — server-side transactional email backed by Resend.
//
// Why this lives in an Edge Function and not the frontend: RESEND_API_KEY is a
// secret. The web app is a client-only Vite SPA, so anything it holds ships to
// the browser. This function keeps the key server-side (a Supabase secret) and
// exposes a narrow POST contract the frontend can call safely.
//
// Request  (POST, JSON): { to, subject, html?, text?, from?, cc?, bcc?, replyTo? }
//   - `to` accepts a string or string[]; `html` or `text` is required.
// Response (JSON):        { ok: true, id } on success, { ok: false, error } otherwise.

interface SendEmailRequest {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string | string[];
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
// Verify a domain at resend.com/domains, then set EMAIL_FROM to an address on it
// (e.g. "GSL Student Support <noreply@rfdgh.com>"). Until then Resend only allows
// the shared onboarding sender, which can reach the account owner's address only.
const DEFAULT_FROM = Deno.env.get('EMAIL_FROM') ?? 'GSL Student Support <onboarding@resend.dev>';
// Lock this to the app origin in production (e.g. https://app.rfdgh.com).
const ALLOWED_ORIGIN = Deno.env.get('EMAIL_ALLOWED_ORIGIN') ?? '*';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  Vary: 'Origin',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ ok: false, error: 'Method not allowed' }, 405);
  }
  if (!RESEND_API_KEY) {
    // Misconfiguration, not a client error — don't leak which env var is missing.
    return json({ ok: false, error: 'Email service is not configured' }, 500);
  }

  let payload: Partial<SendEmailRequest>;
  try {
    payload = await req.json();
  } catch {
    return json({ ok: false, error: 'Invalid JSON body' }, 400);
  }

  const { to, subject, html, text, from, cc, bcc, replyTo } = payload;

  if (!to || (Array.isArray(to) && to.length === 0)) {
    return json({ ok: false, error: '`to` is required' }, 400);
  }
  if (!subject || typeof subject !== 'string') {
    return json({ ok: false, error: '`subject` is required' }, 400);
  }
  if (!html && !text) {
    return json({ ok: false, error: 'Provide `html` or `text`' }, 400);
  }

  let res: Response;
  try {
    res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: from ?? DEFAULT_FROM,
        to,
        subject,
        html,
        text,
        cc,
        bcc,
        reply_to: replyTo,
      }),
    });
  } catch (err) {
    return json({ ok: false, error: `Could not reach email provider: ${String(err)}` }, 502);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Surface Resend's message (e.g. unverified-domain / test-mode limits) so
    // callers get an actionable error rather than a bare 500.
    return json(
      { ok: false, error: data?.message ?? 'Failed to send email', details: data },
      res.status,
    );
  }

  return json({ ok: true, id: data?.id });
});
