# Supabase setup

This project uses a **hosted** Supabase project — there's no local Supabase
CLI or Postgres involved. Run everything below in the Supabase Dashboard.

## 1. Run the migrations

Dashboard → **SQL Editor** → New query. Run these files **in order**, each as
its own query (paste the whole file, click Run):

1. `supabase/migrations/0001_schema.sql` — tables, constraints, helper functions
2. `supabase/migrations/0002_rls.sql` — Row-Level Security policies
3. `supabase/migrations/0003_storage.sql` — the `guide-media` storage bucket

## 2. (Optional) Seed demo data

`supabase/seed.sql` populates the roster (Jordan R., Maya P., Tre W., Sam K.,
Devin L., Ana G. — all "invite pending") plus a demo week of shifts, class
times, hours, tasks, and the six real how-to guides with their full step
copy. Run it once, the same way, after the three migrations above.

Skip it if you'd rather start with an empty crew — you can add real roster
names later from the Crew screen once the app is running.

The whole file runs as one transaction (`begin`/`commit`) — if any statement
in it fails, everything in the file rolls back together, so it's always
safe to just fix the error and re-run the whole file from the top. (If
you hit an error before this transaction wrapper was added: running
`select count(*) from profiles;` and getting `0` confirms nothing was left
behind, since Postgres rolls back an entire multi-statement paste on error
by default — safe to re-run.)

## 3. Turn off email confirmation (recommended for this crew)

By default Supabase requires a user to click a confirmation link before
their session is active, which would stall the register screen's "Create
account" / "Join and request access" flow (the design has no separate
"check your email" step). For a small, trusted crew this is safe to skip:

Dashboard → **Authentication → Sign In / Providers → Email** → turn off
**Confirm email**.

If you'd rather keep email confirmation on, tell me and I'll add a
confirmation-pending state to the register screen instead.

## 4. Nothing else to configure

No service-role key, no Edge Function secrets, no local `.env` beyond what's
already in `.env.local` (`NEXT_PUBLIC_SUPABASE_URL` /
`NEXT_PUBLIC_SUPABASE_ANON_KEY`). Every privileged operation the app needs
(claiming a roster entry at registration, fanning out a notification to
another crew member) is implemented as a `SECURITY DEFINER` Postgres
function in `0001_schema.sql`, callable by the `authenticated` role — see
`claim_roster_profile` and `create_notification`.
