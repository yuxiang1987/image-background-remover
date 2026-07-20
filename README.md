# Backgroundly — Image Background Remover

A Cloudflare-native image background remover powered by the remove.bg API. Images are proxied in memory and are never persisted by the application.

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and add the public Turnstile site key.
3. Copy `.dev.vars.example` to `.dev.vars` and add the remove.bg and Turnstile secret keys.
4. Run `npm run dev`.

The app remains usable without Turnstile during local development. The remove.bg key is required to process a real image.

## Required production configuration

- `REMOVE_BG_API_KEY` — encrypted Cloudflare secret.
- `TURNSTILE_SECRET_KEY` — encrypted Cloudflare secret.
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` — public build variable.
- `ALLOWED_ORIGIN` — production site origin.
- `SITE_URL` — canonical production URL.

## Verification

- `npm run build`
- `npm test`
- `npm run lint`

See [docs/MVP-PRD.md](docs/MVP-PRD.md) for product requirements and acceptance criteria.
