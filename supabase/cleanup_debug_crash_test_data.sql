-- Removes test accounts created while reproducing the ToastProvider
-- crash on /crew/[id]/classes ("This page couldn't load").
--
-- These are brand-new profiles, not claims on seeded/real roster names,
-- so (unlike cleanup_e2e_test_data.sql) there is no un-claim step —
-- just delete them. Scoped two ways so it can never touch real data:
--   1. Exact names used only by this debugging session ("Debug Admin",
--      "Debug Admin Two", "Debug Intern") — not any real crew member's
--      name.
--   2. The two registered accounts also require an '@example.com'
--      email, which only throwaway test accounts use.
-- "Debug Intern" was added via the roster's "Add a name" and was never
-- registered, so it has no email/auth user at all — matched by name only.
--
-- Each delete also requires zero real data anywhere a foreign key could
-- point to it, so this is safe even if it's run after the real crew has
-- started using the app.
--
-- Wrapped in a transaction — safe to run more than once.

begin;

delete from profiles p
where (
    (p.full_name in ('Debug Admin', 'Debug Admin Two') and p.email like '%@example.com')
    or p.full_name = 'Debug Intern'
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

-- Delete the test auth users (Supabase Auth) now that nothing in
-- profiles references them.
delete from auth.users where email like 'debug.admin%@example.com';

commit;
