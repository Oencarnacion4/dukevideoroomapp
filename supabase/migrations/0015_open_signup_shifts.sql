-- Lets an admin post an open slot that STAYS open after someone claims it —
-- e.g. an optional Saturday practice where anyone who wants to come taps
-- Claim, instead of the slot closing after the first person. The original
-- open row (assignee_id null, status 'open') never changes; each claim
-- inserts a new accepted row alongside it via claim_open_signup_shift().

alter table shifts add column if not exists open_signup boolean not null default false;

alter table shifts drop constraint if exists shifts_open_signup_requires_open;
alter table shifts add constraint shifts_open_signup_requires_open
  check (not open_signup or status = 'open');

-- SECURITY DEFINER so an ordinary crew member can insert their own claim row
-- without a broader shifts-insert grant — mirrors claim_roster_profile.
create or replace function claim_open_signup_shift(shift_id uuid)
  returns shifts
  language plpgsql security definer set search_path = public as $$
declare
  src shifts;
  result shifts;
  caller_id uuid := current_profile_id();
begin
  if caller_id is null then
    raise exception 'Not signed in';
  end if;

  select * into src from shifts where id = shift_id and status = 'open' and open_signup = true;
  if src.id is null then
    raise exception 'This slot is not open for sign-up';
  end if;

  if exists (
    select 1 from shifts
    where assignee_id = caller_id
      and date = src.date
      and start_time = src.start_time
      and coalesce(end_time, '00:00'::time) = coalesce(src.end_time, '00:00'::time)
      and session_type = src.session_type
      and location = src.location
      and status <> 'declined'
  ) then
    raise exception 'You already claimed this slot';
  end if;

  insert into shifts (
    day_of_week, date, start_time, end_time, session_type, camera_role,
    location, assignee_id, status, note, created_by, open_signup
  )
  values (
    src.day_of_week, src.date, src.start_time, src.end_time, src.session_type, src.camera_role,
    src.location, caller_id, 'accepted', src.note, src.created_by, false
  )
  returning * into result;

  return result;
end;
$$;

revoke execute on function claim_open_signup_shift(uuid) from public;
grant execute on function claim_open_signup_shift(uuid) to authenticated;
