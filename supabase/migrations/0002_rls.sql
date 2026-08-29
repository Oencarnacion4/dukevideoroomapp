-- Row-Level Security. Run after 0001_schema.sql.
--
-- This app never uses the Supabase service-role key at runtime — every
-- write goes through the anon key as the signed-in user, so these
-- policies are the actual security boundary (see 0001_schema.sql's
-- current_profile_id()/current_role_name()/create_notification() helpers
-- for the handful of cases that need to look across users).

alter table profiles enable row level security;
alter table app_settings enable row level security;
alter table shifts enable row level security;
alter table swap_requests enable row level security;
alter table availability enable row level security;
alter table time_entries enable row level security;
alter table tasks enable row level security;
alter table task_completions enable row level security;
alter table guides enable row level security;
alter table guide_steps enable row level security;
alter table notifications enable row level security;

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
create policy profiles_select on profiles
  for select to authenticated using (true);

-- Fresh signup: intern with no roster match, or a lead/staff self-registering.
create policy profiles_self_insert on profiles
  for insert to authenticated with check (auth_user_id = auth.uid());

-- Admin pre-populating the roster with name-only, unclaimed entries.
create policy profiles_admin_insert on profiles
  for insert to authenticated with check (current_role_name() in ('lead', 'staff'));

-- Claiming an unclaimed roster row also goes through claim_roster_profile(),
-- which is the enforced path; this mirrors it at the table level.
create policy profiles_claim_update on profiles
  for update to authenticated
  using (auth_user_id is null)
  with check (auth_user_id = auth.uid());

create policy profiles_self_update on profiles
  for update to authenticated
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

create policy profiles_admin_update on profiles
  for update to authenticated
  using (current_role_name() in ('lead', 'staff'));

-- ---------------------------------------------------------------------
-- app_settings — everyone reads the flags, only admins change them
-- ---------------------------------------------------------------------
create policy app_settings_select on app_settings
  for select to authenticated using (true);

create policy app_settings_admin_update on app_settings
  for update to authenticated using (current_role_name() in ('lead', 'staff'));

-- ---------------------------------------------------------------------
-- shifts
-- ---------------------------------------------------------------------
create policy shifts_select on shifts
  for select to authenticated using (true);

create policy shifts_admin_insert on shifts
  for insert to authenticated with check (current_role_name() in ('lead', 'staff'));

create policy shifts_admin_all_update on shifts
  for update to authenticated using (current_role_name() in ('lead', 'staff'));

-- Accept / decline / add-a-note on your own shift, or claim an open slot —
-- the final row must land assigned to you.
create policy shifts_self_respond on shifts
  for update to authenticated
  using (assignee_id = current_profile_id() or status = 'open')
  with check (assignee_id = current_profile_id());

create policy shifts_admin_delete on shifts
  for delete to authenticated using (current_role_name() in ('lead', 'staff'));

-- ---------------------------------------------------------------------
-- swap_requests
-- ---------------------------------------------------------------------
create policy swap_requests_select on swap_requests
  for select to authenticated using (true);

create policy swap_requests_insert on swap_requests
  for insert to authenticated with check (from_profile = current_profile_id());

create policy swap_requests_respond_update on swap_requests
  for update to authenticated
  using (to_profile = current_profile_id() or current_role_name() in ('lead', 'staff'));

-- ---------------------------------------------------------------------
-- availability
-- ---------------------------------------------------------------------
create policy availability_select on availability
  for select to authenticated using (true);

create policy availability_write on availability
  for all to authenticated
  using (
    profile_id = current_profile_id()
    or (current_role_name() in ('lead', 'staff') and staff_can_edit_classes())
  )
  with check (
    profile_id = current_profile_id()
    or (current_role_name() in ('lead', 'staff') and staff_can_edit_classes())
  );

-- ---------------------------------------------------------------------
-- time_entries — staff are salaried and never get a row of their own
-- ---------------------------------------------------------------------
create policy time_entries_select on time_entries
  for select to authenticated
  using (profile_id = current_profile_id() or current_role_name() in ('lead', 'staff'));

create policy time_entries_write on time_entries
  for all to authenticated
  using (profile_id = current_profile_id() and current_role_name() <> 'staff')
  with check (profile_id = current_profile_id() and current_role_name() <> 'staff');

-- ---------------------------------------------------------------------
-- tasks — shared buckets are writable by the whole crew; personal is not
-- ---------------------------------------------------------------------
create policy tasks_select on tasks
  for select to authenticated
  using (bucket <> 'personal' or owner_id = current_profile_id());

create policy tasks_write on tasks
  for all to authenticated
  using (bucket <> 'personal' or owner_id = current_profile_id())
  with check (bucket <> 'personal' or owner_id = current_profile_id());

-- ---------------------------------------------------------------------
-- task_completions — always personal: "did I do this today"
-- ---------------------------------------------------------------------
create policy task_completions_own on task_completions
  for all to authenticated
  using (profile_id = current_profile_id())
  with check (profile_id = current_profile_id());

-- ---------------------------------------------------------------------
-- guides + guide_steps — anyone can publish; author (or admin) can edit
-- ---------------------------------------------------------------------
create policy guides_select on guides
  for select to authenticated using (true);

create policy guides_insert on guides
  for insert to authenticated with check (author_id = current_profile_id());

create policy guides_update on guides
  for update to authenticated
  using (author_id = current_profile_id() or current_role_name() in ('lead', 'staff'));

create policy guides_delete on guides
  for delete to authenticated
  using (author_id = current_profile_id() or current_role_name() in ('lead', 'staff'));

create policy guide_steps_select on guide_steps
  for select to authenticated using (true);

create policy guide_steps_write on guide_steps
  for all to authenticated
  using (
    exists (
      select 1 from guides g
      where g.id = guide_steps.guide_id
        and (g.author_id = current_profile_id() or current_role_name() in ('lead', 'staff'))
    )
  )
  with check (
    exists (
      select 1 from guides g
      where g.id = guide_steps.guide_id
        and (g.author_id = current_profile_id() or current_role_name() in ('lead', 'staff'))
    )
  );

-- ---------------------------------------------------------------------
-- notifications — each person sees only their own; inserts go through
-- create_notification() (SECURITY DEFINER), never a direct table insert
-- ---------------------------------------------------------------------
create policy notifications_select on notifications
  for select to authenticated using (profile_id = current_profile_id());

create policy notifications_update on notifications
  for update to authenticated using (profile_id = current_profile_id());
