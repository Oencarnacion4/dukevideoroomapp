-- RLS policies (0002_rls.sql) restrict *which* rows a role can touch, but
-- Postgres still requires the underlying table-level GRANT before RLS is
-- ever evaluated — without it every query fails with "permission denied
-- for table X", regardless of how permissive the policies are. This was
-- missed because these tables were created directly via the SQL Editor,
-- which doesn't carry the default-privilege grants Supabase wires up for
-- tables it provisions itself.

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on
  profiles,
  app_settings,
  shifts,
  swap_requests,
  availability,
  time_entries,
  tasks,
  task_completions,
  guides,
  guide_steps,
  notifications
to authenticated;
