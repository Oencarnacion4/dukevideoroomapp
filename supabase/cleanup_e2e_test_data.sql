-- Removes test data left behind by Claude's end-to-end verification pass.
-- Nothing here touches seeded or real crew data — every condition below
-- is scoped to the '@example.com' domain (used only by the throwaway test
-- accounts; real crew register with personal emails) or to literal "E2E"
-- markers used only in this test's own task/shift notes.
--
-- Two of my test registrations (as "Jordan R." and "Maya P.") matched and
-- claimed those seeded roster entries with fake test emails — which means
-- the real Jordan and Maya can no longer register and attach to their
-- waiting shifts/hours/classes until this is undone. So this script
-- un-claims those two back to "Invite pending" (their seeded shifts, time
-- entries, and availability are untouched) rather than deleting them.
--
-- Previous version's bug: it unclaimed BOTH the stray duplicate "Jordan
-- R." and the legitimate seeded one in the same UPDATE. profiles has a
-- unique index on (full_name) WHERE auth_user_id IS NULL — so the instant
-- both rows shared that null-and-same-name state, Postgres rejected it.
-- Fixed by reordering: the stray duplicate is identified and deleted
-- FIRST, using a criterion that never depends on auth_user_id's current
-- value (zero real data of its own — the true seeded row always has
-- shifts/availability/time entries from seed.sql, a duplicate never
-- does), so by the time the un-claim UPDATE runs, only one row per name
-- remains and there is nothing left to collide with.
--
-- Wrapped in a transaction — safe to run more than once (every step's
-- WHERE clause matches nothing once already applied).

begin;

-- 1. Delete the shift I posted through the builder during testing.
delete from shifts where note = 'E2E builder test note';

-- 2. Delete the personal task I added during testing.
delete from tasks where title = 'E2E test personal task';

-- 3. Delete the one extra clock-in/out cycle I ran on Maya's seeded
--    timesheet today (source/label/hours/date match exactly what my
--    test produced — this will not match a real crew member's own
--    same-day clock entry, since it also requires source='clocked' AND
--    hours=0.25 AND label='Video room' all at once).
delete from time_entries
where source = 'clocked'
  and session_label = 'Video room'
  and hours = 0.25
  and date = current_date;

-- 4. Delete stray duplicate roster rows from before the roster-matching
--    fix: a test-email row for one of the six seeded names that has NO
--    real data of its own anywhere a foreign key could point to it. This
--    never matches the legitimate seeded row (which always has at least
--    one of these), regardless of whether it's currently claimed —
--    that's what makes it safe to run before the un-claim step below.
delete from profiles p
where p.full_name in ('Jordan R.', 'Maya P.', 'Tre W.', 'Sam K.', 'Devin L.', 'Ana G.')
  and p.email like '%@example.com'
  and not exists (select 1 from shifts s where s.assignee_id = p.id)
  and not exists (select 1 from shifts s where s.created_by = p.id)
  and not exists (select 1 from availability a where a.profile_id = p.id)
  and not exists (select 1 from time_entries t where t.profile_id = p.id)
  and not exists (select 1 from tasks tk where tk.owner_id = p.id)
  and not exists (select 1 from task_completions tc where tc.profile_id = p.id)
  and not exists (select 1 from guides g where g.author_id = p.id)
  and not exists (select 1 from swap_requests sr where sr.from_profile = p.id or sr.to_profile = p.id)
  and not exists (select 1 from notifications n where n.profile_id = p.id);

-- 5. Now that at most one row per seeded name remains, un-claim the
--    roster identities my test accounts registered under, restoring
--    "Invite pending" so the real people can register later and
--    correctly attach to this same data.
update profiles
set auth_user_id = null, email = null, roster_confirmed = false
where email like '%@example.com'
  and full_name in ('Jordan R.', 'Maya P.', 'Tre W.', 'Sam K.', 'Devin L.', 'Ana G.');

-- 6. Delete the fresh test staff account entirely — it's not a roster
--    identity, just test scaffolding (safe now that its shift is gone;
--    the same FK guards as step 4 apply, though none are expected).
delete from profiles p
where p.full_name = 'E2E Test Staffer'
  and not exists (select 1 from shifts s where s.assignee_id = p.id)
  and not exists (select 1 from shifts s where s.created_by = p.id)
  and not exists (select 1 from availability a where a.profile_id = p.id)
  and not exists (select 1 from time_entries t where t.profile_id = p.id)
  and not exists (select 1 from tasks tk where tk.owner_id = p.id)
  and not exists (select 1 from task_completions tc where tc.profile_id = p.id)
  and not exists (select 1 from guides g where g.author_id = p.id)
  and not exists (select 1 from swap_requests sr where sr.from_profile = p.id or sr.to_profile = p.id)
  and not exists (select 1 from notifications n where n.profile_id = p.id);

-- 7. Delete the test auth users (Supabase Auth) now that nothing in
--    profiles references them.
delete from auth.users where email like '%@example.com';

commit;
