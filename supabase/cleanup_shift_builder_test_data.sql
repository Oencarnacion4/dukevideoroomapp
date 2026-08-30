-- Removes test accounts created while verifying the multi-person shift
-- picker and the "Free until X" availability hint.
--
-- Scoped to exact-prefix test names used only in this debugging session
-- ("Debug Admin Three", "Debug Camper One", "Debug Camper Two" — some
-- runs appended a timestamp, so this matches with LIKE) plus the
-- '@example.com' email domain for the registered admin account, which
-- only throwaway test accounts use. None of this touches real crew
-- names or data.
--
-- Unlike the FK-guarded deletes in the other cleanup scripts, step 1
-- explicitly clears any availability blocks these test profiles picked
-- up first, since a leftover block would otherwise block the profile
-- delete's own "no real data" guard.
--
-- Wrapped in a transaction — safe to run more than once.

begin;

-- 1. Clear any class/availability blocks the test crew profiles picked up.
delete from availability
where profile_id in (
  select id from profiles where full_name like 'Debug Camper One%' or full_name like 'Debug Camper Two%'
);

-- 2. Delete the test profiles (guard still applies to anything unexpected).
delete from profiles p
where (
    p.full_name like 'Debug Admin Three%'
    or p.full_name like 'Debug Camper One%'
    or p.full_name like 'Debug Camper Two%'
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

-- 3. Delete the test auth users (Supabase Auth) now that nothing in
--    profiles references them.
delete from auth.users where email like 'debug.admin3.%@example.com';

commit;
