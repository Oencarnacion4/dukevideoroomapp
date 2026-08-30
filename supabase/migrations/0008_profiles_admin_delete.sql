-- Lets the head intern or staff remove a crew member directly from the
-- app (stray duplicates, someone who left, test entries) instead of
-- needing a SQL script run by hand. Restricted so an admin can't delete
-- their own profile (avoids locking themselves out), and Postgres's own
-- foreign-key constraints still block removing anyone with real history
-- on record (shifts they created, swap requests, etc.) — the app
-- surfaces that as a friendly error rather than silently losing data.
create policy profiles_admin_delete on profiles
  for delete to authenticated
  using (current_role_name() in ('lead', 'staff') and id <> current_profile_id());
