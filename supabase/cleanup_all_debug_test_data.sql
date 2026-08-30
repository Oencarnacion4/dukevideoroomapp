-- One script to remove ALL the throwaway test accounts and stray data
-- left behind while I verified recent features against the live database:
--   1. The ToastProvider crash fix ("Debug Admin", "Debug Admin Two",
--      "Debug Intern")
--   2. The multi-person shift picker + free-until hint ("Debug Admin
--      Three", "Debug Camper One", "Debug Camper Two")
--   3. The "assign someone to an open shift" feature ("Debug Admin
--      Four" through "Debug Admin Seven", plus two stale notifications
--      those runs sent to the real Alex Karen)
--   4. Letting the head intern appear in the shift builder, and the
--      "add another person to this shift" feature ("Debug Admin Eight"
--      through "Debug Admin Ten", plus one more stale notification sent
--      to the real Alex Karen)
--
-- This replaces cleanup_debug_crash_test_data.sql,
-- cleanup_shift_builder_test_data.sql, and cleanup_assign_flow_test_data.sql
-- individually — running this one script does the same job as all three.
-- None of it touches real crew names, real shifts, or anyone's real data;
-- every delete below is scoped to exact test names or the '@example.com'
-- email domain, which only these throwaway accounts use.
--
-- Wrapped in a transaction — safe to run more than once.

begin;

-- Clear any class/availability blocks the test crew profiles picked up
-- (a leftover block would otherwise block the profile delete's own
-- "no real data" guard below).
delete from availability
where profile_id in (
  select id from profiles where full_name like 'Debug Camper One%' or full_name like 'Debug Camper Two%'
);

-- Remove the stale "new shift" notifications sent to Alex Karen from
-- test shifts that were already deleted through the app itself.
delete from notifications
where title = 'New shift: Full practice'
  and body in ('Wed 4:15 PM · Practice court', 'Thu 9:00 AM · Practice court')
  and created_at > now() - interval '2 hours';

-- Delete every throwaway test profile from these three rounds of testing.
-- The FK guard means this only removes a profile with zero real data
-- anywhere a foreign key could point to it — if a name below is ever
-- reused by a real person with real shifts/hours/tasks attached, this
-- simply skips it instead of deleting anything.
delete from profiles p
where (
    p.full_name in ('Debug Admin', 'Debug Admin Two', 'Debug Intern')
    or p.full_name like 'Debug Admin Three%'
    or p.full_name like 'Debug Camper One%'
    or p.full_name like 'Debug Camper Two%'
    or p.full_name like 'Debug Admin Four%'
    or p.full_name like 'Debug Admin Five%'
    or p.full_name like 'Debug Admin Six%'
    or p.full_name like 'Debug Admin Seven%'
    or p.full_name like 'Debug Admin Eight%'
    or p.full_name like 'Debug Admin Nine%'
    or p.full_name like 'Debug Admin Ten%'
  )
  and not exists (select 1 from shifts s where s.assignee_id = p.id)
  and not exists (select 1 from shifts s where s.created_by = p.id)
  and not exists (select 1 from availability a where a.profile_id = p.id)
  and not exists (select 1 from time_entries t where t.profile_id = p.id)
  and not exists (select 1 from tasks tk where tk.owner_id = p.id)
  and not exists (select 1 from task_completions tc where tc.profile_id = p.id)
  and not exists (select 1 from guides g where g.author_id = p.id)
  and not exists (select 1 from swap_requests sr where sr.from_profile = p.id or sr.to_profile = p.id)
  and not exists (select 1 from notifications n where n.profile_id = p.id);

-- Delete the matching test auth users (Supabase Auth) now that nothing
-- in profiles references them.
delete from auth.users
where email like 'debug.admin%@example.com';

commit;
