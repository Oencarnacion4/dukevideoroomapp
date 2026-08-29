# Video Room

The Duke men's basketball practice video crew's scheduling, hours, task board,
and how-to app. Built from the design handoff in [`design/HANDOFF.md`](design/HANDOFF.md)
(prototype: `design/Video Room.dc.html`).

## Stack

- **Next.js (App Router) + TypeScript + Tailwind CSS v4**
- **Supabase** — Postgres, email/password auth, Storage, Row-Level Security
- Installable PWA (manifest + service worker)

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project's values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

See `.env.example`. This app talks to a **hosted** Supabase project — there is
no local Supabase/Postgres stack required or expected. You'll need:

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from your
  Supabase project's API settings, used by the browser and server clients.
- `SUPABASE_SERVICE_ROLE_KEY` — server-only, used for admin operations
  (roster seeding, notification fan-out). Never expose this to the client.

## Project layout

```
src/app/            routes (App Router)
src/components/ui/  Industry design-system primitives (Button, Card, Tag, ...)
src/components/     screen-specific components, grouped by feature
src/lib/domain/     pure business logic ported from the prototype (roster
                    matching, conflict checking, hour math) — unit tested
src/lib/supabase/   browser/server Supabase clients
supabase/           SQL migrations + seed data for the hosted project
design/             the original design handoff — reference only, not code
```

## Design system

Colors, type, spacing, and component rules live in `design/HANDOFF.md` under
"Design Tokens" and are implemented as CSS custom properties in
`src/app/globals.css`. The visual system is deliberately square — zero
border-radius, hairline borders, blueprint corner registration marks on
cards — see that section before changing any primitive in `src/components/ui/`.
