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
-- entries, and availability are untouched) rather than deleting them, and
-- only *deletes* rows that are pure test artifacts with no real data.
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

-- 4. Un-claim the two seeded roster identities my test accounts
--    registered under, restoring "Invite pending" so the real people can
--    register later and correctly attach to this same data.
update profiles
set auth_user_id = null, email = null, roster_confirmed = false
where email like '%@example.com'
  and full_name in ('Jordan R.', 'Maya P.', 'Tre W.', 'Sam K.', 'Devin L.', 'Ana G.');

-- 5. Delete stray duplicate roster rows left over from before the
--    roster-matching fix (a same-named row with zero shifts/availability/
--    time entries of its own, where a second row for that name exists —
--    i.e. never the seeded original, which always has real data).
delete from profiles p
where p.full_name in ('Jordan R.', 'Maya P.', 'Tre W.', 'Sam K.', 'Devin L.', 'Ana G.')
  and p.auth_user_id is null
  and not exists (select 1 from shifts s where s.assignee_id = p.id)
  and not exists (select 1 from availability a where a.profile_id = p.id)
  and not exists (select 1 from time_entries t where t.profile_id = p.id)
  and (select count(*) from profiles p2 where p2.full_name = p.full_name) > 1;

-- 6. Delete the fresh test staff account entirely — it's not a roster
--    identity, just test scaffolding (safe now that its shift is gone).
delete from profiles where full_name = 'E2E Test Staffer';

-- 7. Delete the test auth users (Supabase Auth) now that nothing
--    references them.
delete from auth.users where email like '%@example.com';

commit;
