-- The prototype kept "currently clocked in" as in-memory session state
-- (this.state.clockIn). A real, multi-device app needs that to survive a
-- reload or a switch to another device, so it lives on the profile row —
-- already covered by the existing profiles_self_update RLS policy.
alter table profiles add column if not exists clock_in_at timestamptz;
alter table profiles add column if not exists clock_label text;
