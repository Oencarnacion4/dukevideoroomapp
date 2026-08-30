-- Video Room schema
-- Run this in the Supabase Dashboard SQL Editor (Database > SQL Editor).
-- No service-role key or local Supabase CLI is required for this project —
-- everything here runs as the SQL Editor's own elevated connection.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
-- profiles.id is its own identity, independent of auth.users, because the
-- roster deliberately holds name-only "invite pending" rows before anyone
-- signs up (see design/HANDOFF.md "Registration and roster matching").
-- auth_user_id is attached later, either by an admin-added roster entry
-- being claimed at registration, or immediately for a fresh signup.
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users (id) on delete set null,
  full_name text not null,
  email text,
  role text not null default 'intern' check (role in ('intern', 'lead', 'staff')),
  roster_confirmed boolean not null default false,
  alerts_seen_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists profiles_auth_user_id_idx on profiles (auth_user_id);

-- Lets the seed script insert roster placeholders without creating
-- duplicates if it's ever run more than once.
create unique index if not exists profiles_unclaimed_name_idx on profiles (full_name)
  where auth_user_id is null;

-- ---------------------------------------------------------------------
-- app_settings — singleton row for the flags the handoff calls out as
-- settings, not hardcoded values (staffCanEditClasses, requireSwapOnDecline).
-- ---------------------------------------------------------------------
create table if not exists app_settings (
  id boolean primary key default true check (id),
  staff_can_edit_classes boolean not null default true,
  require_swap_on_decline boolean not null default true
);

insert into app_settings (id) values (true) on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- shifts
-- ---------------------------------------------------------------------
create table if not exists shifts (
  id uuid primary key default gen_random_uuid(),
  day_of_week text not null check (day_of_week in ('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun')),
  date date not null,
  start_time time not null,
  end_time time, -- null = open end
  session_type text not null check (
    session_type in (
      'Full practice', 'Game', 'Half-court work', 'Individual workouts',
      'Early lift', 'Live scrimmage', 'Film session prep'
    )
  ),
  camera_role text,
  location text not null,
  assignee_id uuid references profiles (id) on delete set null,
  status text not null default 'open' check (status in ('pending', 'accepted', 'declined', 'swap_sent', 'open')),
  note text,
  created_by uuid not null references profiles (id),
  created_at timestamptz not null default now(),
  constraint shifts_open_slot_consistency check (
    (assignee_id is null and status = 'open') or (assignee_id is not null and status <> 'open')
  )
);

create index if not exists shifts_assignee_id_idx on shifts (assignee_id);
create index if not exists shifts_date_idx on shifts (date);

-- ---------------------------------------------------------------------
-- swap_requests
-- ---------------------------------------------------------------------
create table if not exists swap_requests (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references shifts (id) on delete cascade,
  from_profile uuid not null references profiles (id),
  to_profile uuid not null references profiles (id),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now()
);

create index if not exists swap_requests_shift_id_idx on swap_requests (shift_id);

-- ---------------------------------------------------------------------
-- availability — class times / "not available" blocks
-- ---------------------------------------------------------------------
create table if not exists availability (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  day_of_week text not null check (day_of_week in ('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun')),
  start_time time,
  end_time time,
  all_day boolean not null default false,
  label text not null,
  constraint availability_time_or_all_day check (
    all_day or (start_time is not null and end_time is not null and end_time > start_time)
  )
);

create index if not exists availability_profile_id_idx on availability (profile_id);

-- ---------------------------------------------------------------------
-- time_entries — the timesheet
-- ---------------------------------------------------------------------
create table if not exists time_entries (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  date date not null,
  session_label text not null,
  hours numeric(5, 2) not null check (hours > 0),
  source text not null check (source in ('clocked', 'manual')),
  clock_in_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists time_entries_profile_id_idx on time_entries (profile_id);

-- ---------------------------------------------------------------------
-- tasks + task_completions
-- ---------------------------------------------------------------------
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  bucket text not null check (bucket in ('assigned', 'daily', 'practice', 'post', 'game', 'personal')),
  title text not null,
  assigned_by text,
  due_label text,
  tag text,
  owner_id uuid references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint tasks_personal_needs_owner check (
    (bucket = 'personal' and owner_id is not null) or (bucket <> 'personal')
  )
);

create index if not exists tasks_bucket_idx on tasks (bucket);

-- Completion is per person, per calendar day — daily/practice buckets
-- reset every day, so "done" is a dated fact, not a boolean on the task.
create table if not exists task_completions (
  task_id uuid not null references tasks (id) on delete cascade,
  profile_id uuid not null references profiles (id) on delete cascade,
  completed_on date not null,
  completed_at timestamptz not null default now(),
  primary key (task_id, profile_id, completed_on)
);

-- ---------------------------------------------------------------------
-- guides + guide_steps
-- ---------------------------------------------------------------------
create table if not exists guides (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles (id),
  kicker text not null check (kicker in ('Hardware', 'Software', 'Workflow', 'Game day')),
  title text not null,
  format text not null check (format in ('written', 'video')),
  intro text not null,
  video_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists guide_steps (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid not null references guides (id) on delete cascade,
  position int not null,
  title text not null,
  body text not null,
  image_url text
);

create index if not exists guide_steps_guide_id_idx on guide_steps (guide_id);

create or replace function set_updated_at() returns trigger
  language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists guides_set_updated_at on guides;
create trigger guides_set_updated_at
  before update on guides
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_profile_id_idx on notifications (profile_id);

-- ---------------------------------------------------------------------
-- Helper functions used throughout RLS policies. SECURITY DEFINER so they
-- can read `profiles` without recursing through that table's own RLS.
-- ---------------------------------------------------------------------
create or replace function current_profile_id() returns uuid
  language sql stable security definer set search_path = public as $$
  select id from profiles where auth_user_id = auth.uid();
$$;

create or replace function current_role_name() returns text
  language sql stable security definer set search_path = public as $$
  select role from profiles where auth_user_id = auth.uid();
$$;

create or replace function staff_can_edit_classes() returns boolean
  language sql stable security definer set search_path = public as $$
  select staff_can_edit_classes from app_settings where id = true;
$$;

-- Fan-out helper: lets any authenticated user create a notification row for
-- ANY profile (e.g. notifying a shift's assignee) without ever needing the
-- service-role key. SECURITY DEFINER bypasses the (deliberately narrow)
-- notifications RLS below; only this function can insert.
create or replace function create_notification(target_profile_id uuid, p_title text, p_body text default null)
  returns void
  language plpgsql security definer set search_path = public as $$
begin
  insert into notifications (profile_id, title, body)
  values (target_profile_id, p_title, p_body);
end;
$$;

revoke execute on function create_notification(uuid, text, text) from public;
grant execute on function create_notification(uuid, text, text) to authenticated;

-- Registration: attach the caller's newly-created auth user to an existing
-- unclaimed roster row. Only rows with no auth_user_id yet can be claimed,
-- and the caller can only ever attach themselves (auth.uid()) — enforced
-- here rather than relying solely on the mirrored RLS policy below.
create or replace function claim_roster_profile(target_id uuid, p_email text)
  returns profiles
  language plpgsql security definer set search_path = public as $$
declare
  result profiles;
begin
  update profiles
  set auth_user_id = auth.uid(), email = p_email, roster_confirmed = true
  where id = target_id and auth_user_id is null
  returning * into result;

  if result.id is null then
    raise exception 'Roster entry already claimed or not found';
  end if;

  return result;
end;
$$;

revoke execute on function claim_roster_profile(uuid, text) from public;
grant execute on function claim_roster_profile(uuid, text) to authenticated;
