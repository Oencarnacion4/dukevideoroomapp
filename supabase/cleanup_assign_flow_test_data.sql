-- Removes test artifacts from verifying the "assign someone to an open
-- shift" feature.
--
-- While testing, two throwaway admin accounts each posted an open shift
-- and then assigned it to Alex Karen (a real crew member) to confirm the
-- feature worked end-to-end. Both test shifts were deleted immediately
-- through the app's own admin "Delete slot" control once confirmed working,
-- but the notifications those assignments sent to Alex Karen are still
-- sitting in their Alerts — for a shift that no longer exists. Step 1
-- removes those two.
--
-- Scoped narrowly: exact title/body text my test used, AND created in the
-- last 2 hours. If the real head intern happens to assign Alex Karen a
-- real "Full practice" shift at "Wed 4:15 PM · Practice court" within that
-- same 2-hour window, this would also remove that notification — check
-- the matched rows before running if that combination seems plausible;
-- otherwise this only matches my test data.
--
-- Step 2 removes the throwaway admin profiles created during this same
-- round of testing (Debug Admin Four/Five/Six/Seven — Three was already
-- covered by cleanup_shift_builder_test_data.sql). These never had a real
-- shift attached (the test shifts were assigned to Alex Karen, not to
-- these test admins themselves), so the FK guard passes cleanly.
--
-- Wrapped in a transaction — safe to run more than once.

begin;

-- 1. Remove the stale "new shift" notifications sent to Alex Karen from
--    the deleted test shifts.
delete from notifications
where title = 'New shift: Full practice'
  and body = 'Wed 4:15 PM · Practice court'
  and created_at > now() - interval '2 hours';

-- 2. Remove the throwaway admin test profiles from this round.
delete from profiles p
where (
    p.full_name like 'Debug Admin Four%'
    or p.full_name like 'Debug Admin Five%'
    or p.full_name like 'Debug Admin Six%'
    or p.full_name like 'Debug Admin Seven%'
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

-- 3. Delete their auth users now that nothing in profiles references them.
delete from auth.users
where email like 'debug.admin4.%@example.com'
   or email like 'debug.admin5.%@example.com'
   or email like 'debug.admin6.%@example.com'
   or email like 'debug.admin7.%@example.com';

commit;
