-- Full reset before real weekly use: clears every seeded/demo row so the
-- app starts from a truly empty state — no roster, no shifts, no hours,
-- no tasks, no how-tos. This also removes your own just-registered
-- account, per your request, so you can register again cleanly as the
-- very first real user.
--
-- This is NOT scoped/conservative like the earlier test-data cleanup —
-- it empties every operational table entirely. Only run this because you
-- want a true blank slate; there is nothing selective about it.
--
-- The auth.users deletion is self-scoping: it only removes accounts that
-- are currently linked to a profiles row (id IN a subquery against
-- profiles), so it can never reach into unrelated Supabase Auth users —
-- there just aren't any others in this project right now.
--
-- Wrapped in a transaction; safe to run more than once (an empty table
-- just deletes zero rows the second time).

begin;

-- Children first, in FK dependency order.
delete from task_completions;
delete from notifications;
delete from swap_requests;
delete from shifts;
delete from availability;
delete from time_entries;
delete from tasks;
delete from guide_steps;
delete from guides;

-- Remove the auth accounts backing any existing profile, then the
-- profiles themselves.
delete from auth.users where id in (select auth_user_id from profiles where auth_user_id is not null);
delete from profiles;

commit;
