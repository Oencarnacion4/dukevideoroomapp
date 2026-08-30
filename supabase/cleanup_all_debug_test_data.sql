-- One script to remove ALL the throwaway test accounts and stray data
-- left behind while I verified recent scheduling features against the
-- live database: the ToastProvider crash fix, the multi-person shift
-- picker, the "assign someone to an open shift" feature, letting the
-- head intern appear in crew pickers, and the "add another person to
-- this shift" feature (which also introduced grouping multiple people
-- on the same slot into one card).
--
-- None of it touches real crew names, real shifts, or anyone's real
-- data — every delete below is scoped to exact test names, the
-- '@example.com' email domain (only these throwaway accounts use it),
-- or shifts a test account itself created.
--
-- Wrapped in a transaction — safe to run more than once.

begin;

-- 1. Delete every shift a "Debug Admin ..." test account created. This
--    covers every stray test shift from any round of testing regardless
--    of who it ended up assigned to (a test admin assigning it to a real
--    crew member as "another person to cover this shift" still shows up
--    as created_by that test admin) — and it must run before step 3
--    below, since a leftover shift would otherwise block that profile
--    delete's own "no real data" guard.
delete from shifts
where created_by in (
  select id from profiles where full_name like 'Debug Admin%'
);

-- 2. Remove the stale "new shift" notifications those test assignments
--    sent to Alex Karen (the real crew member my tests happened to add
--    as cover each time) before those shifts were deleted. Scoped to
--    Alex Karen specifically, not by title/body alone, so this can
--    never touch a real notification meant for anyone else — e.g. the
--    real head intern's own assignment notices to Daniel Marin, Charlie
--    Garcia, or Olivia Encarnacion.
delete from notifications
where profile_id = (select id from profiles where full_name = 'Alex Karen')
  and title = 'New shift: Full practice'
  and body in (
    'Wed 4:15 PM · Practice court',
    'Thu 9:00 AM · Practice court',
    'Fri 8:00 AM · Practice court',
    'Mon 2:30 PM · Practice court'
  )
  and created_at > now() - interval '4 hours';

-- 3. Clear any class/availability blocks the test profiles picked up.
delete from availability
where profile_id in (
  select id from profiles
  where full_name like 'Debug Admin%'
     or full_name like 'Debug Camper One%'
     or full_name like 'Debug Camper Two%'
);

-- 4. Delete every throwaway test profile. The FK guard means this only
--    removes a profile with zero real data anywhere a foreign key could
--    point to it — if any of these names is ever reused by a real
--    person with real data attached, this simply skips that row.
delete from profiles p
where (
    p.full_name like 'Debug Admin%'
    or p.full_name = 'Debug Intern'
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

-- 5. Delete the matching test auth users (Supabase Auth) now that
--    nothing in profiles references them.
delete from auth.users
where email like 'debug.admin%@example.com';

commit;
