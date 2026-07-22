# send-email

Server-side transactional email for the GSL Student Support app, backed by
[Resend](https://resend.com). The Resend API key is a **secret**, and the web app is a client-only
Vite SPA — anything the SPA holds ships to the browser. This Edge Function keeps the key server-side
and exposes a narrow POST contract the frontend can call.

## Contract

`POST /functions/v1/send-email`

```jsonc
{
  "to": "someone@example.com", // string | string[]  (required)
  "subject": "Hello", // string             (required)
  "html": "<p>Hi</p>", // string             (html OR text required)
  "text": "Hi", // string
  "from": "Name <a@rfdgh.com>", // optional, defaults to EMAIL_FROM
  "cc": [], // optional
  "bcc": [], // optional
  "replyTo": "reply@rfdgh.com", // optional
}
```

Response: `{ "ok": true, "id": "<resend-id>" }` on success, otherwise
`{ "ok": false, "error": "...", "details": {...} }` with the upstream status code.

## Secrets

| Name                   | Required | Notes                                                            |
| ---------------------- | -------- | ---------------------------------------------------------------- |
| `RESEND_API_KEY`       | yes      | From resend.com/api-keys. Never commit or expose to the browser. |
| `EMAIL_FROM`           | no       | Default sender. Needs a verified domain for real recipients.     |
| `EMAIL_ALLOWED_ORIGIN` | no       | CORS origin. Lock to the app origin in production; `*` for dev.  |

- **Local:** copy `../.env.example` to `../.env.local` and fill in.
- **Deployed:**
  `supabase secrets set RESEND_API_KEY=re_xxx EMAIL_FROM="GSL Student Support <noreply@rfdgh.com>"`

## Run locally (needs Docker)

```bash
supabase functions serve send-email --env-file supabase/functions/.env.local
# then, in another shell:
curl -i -X POST http://localhost:54321/functions/v1/send-email \
  -H 'Content-Type: application/json' \
  -d '{"to":"rfdtechteams@gmail.com","subject":"Local test","html":"<p>hi</p>"}'
```

## Deploy

```bash
supabase login                              # interactive, real terminal
supabase link --project-ref uespikqmsjwenkbokyjh
supabase secrets set RESEND_API_KEY=re_xxx EMAIL_FROM="GSL Student Support <onboarding@resend.dev>"
supabase functions deploy send-email
```

Test the deployed function:

```bash
curl -i -X POST https://uespikqmsjwenkbokyjh.supabase.co/functions/v1/send-email \
  -H 'Content-Type: application/json' \
  -d '{"to":"rfdtechteams@gmail.com","subject":"Deployed test","html":"<p>hi</p>"}'
```

## Sending to real recipients

While the Resend account has no verified domain it runs in **test mode**: it only delivers to the
account owner's own address and only from the shared `onboarding@resend.dev` sender. To email
addresses like `elijahsanta@rfdgh.com`:

1. Verify `rfdgh.com` at resend.com/domains (add the DNS records it lists).
2. Set `EMAIL_FROM` to an address on that domain, e.g. `noreply@rfdgh.com`.

## Security — before production

`verify_jwt = false` (see `supabase/config.toml`) because this app authenticates users via ZITADEL,
not Supabase Auth. That means the endpoint is **open** unless you add a caller check. Before
shipping, do at least:

- Verify the caller's ZITADEL access token in this function (validate against the ZITADEL JWKS /
  introspection), and reject unauthenticated requests.
- Set `EMAIL_ALLOWED_ORIGIN` to the exact app origin.
- Add rate limiting / an allowlist of templates so it can't be used as an open mail relay.
- Rotate `RESEND_API_KEY` if it was ever shared in plaintext.
