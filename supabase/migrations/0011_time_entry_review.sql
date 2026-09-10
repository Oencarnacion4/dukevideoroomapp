-- Only a QR tap-in at the Video Room is physically verified. Everything
-- else (the in-app Clock In button, used off-site, and manual "log hours
-- you worked" entries) is self-reported and now needs a lead/staff sign-off
-- before it counts toward the weekly total — closing the loophole where
-- someone could just type in hours they didn't actually work.

alter table time_entries add column if not exists status text not null default 'approved'
  check (status in ('pending', 'approved', 'rejected'));
alter table time_entries add column if not exists reviewed_by uuid references profiles (id) on delete set null;
alter table time_entries add column if not exists reviewed_at timestamptz;

alter table time_entries drop constraint if exists time_entries_source_check;
alter table time_entries add constraint time_entries_source_check
  check (source in ('clocked', 'manual', 'tap'));

-- Tracks which flow started the current clock session (button vs. QR tap),
-- so clocking out logs the right source/verification for that session.
alter table profiles add column if not exists clock_source text
  check (clock_source in ('clocked', 'tap'));

create index if not exists time_entries_status_idx on time_entries (status);

-- Leads/staff can approve or reject anyone's entry; the existing
-- time_entries_write policy already lets each intern manage their own rows.
create policy time_entries_review on time_entries
  for update to authenticated
  using (current_role_name() in ('lead', 'staff'))
  with check (current_role_name() in ('lead', 'staff'));
