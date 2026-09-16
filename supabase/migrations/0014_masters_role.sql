-- Adds a "masters" role for masters students who use the app for scheduling
-- (finding overlap with crew availability) but aren't paid crew — they don't
-- work shifts and don't track hours. See src/lib/domain/roles.ts.
alter table profiles drop constraint profiles_role_check;
alter table profiles add constraint profiles_role_check
  check (role in ('intern', 'lead', 'staff', 'masters'));

-- Masters students don't track hours either — extend the same guard that
-- already keeps staff from writing time_entries.
drop policy time_entries_write on time_entries;
create policy time_entries_write on time_entries
  for all to authenticated
  using (profile_id = current_profile_id() and current_role_name() not in ('staff', 'masters'))
  with check (profile_id = current_profile_id() and current_role_name() not in ('staff', 'masters'));
