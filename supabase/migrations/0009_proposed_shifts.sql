-- Lets an intern propose their own extra shift (e.g. "coming in Thursday
-- to catch up on editing") instead of only ever being assigned one by an
-- admin. It starts pending the head intern/staff's approval — a new
-- 'proposed' status, distinct from the existing 'pending' (which means
-- the ASSIGNEE hasn't responded yet; here the assignee IS the person who
-- created it, so what's actually outstanding is admin sign-off, not
-- their own reply).

alter table shifts drop constraint if exists shifts_status_check;
alter table shifts add constraint shifts_status_check
  check (status in ('pending', 'accepted', 'declined', 'swap_sent', 'open', 'proposed'));

alter table shifts drop constraint if exists shifts_session_type_check;
alter table shifts add constraint shifts_session_type_check
  check (session_type in (
    'Full practice', 'Game', 'Half-court work', 'Individual workouts',
    'Early lift', 'Live scrimmage', 'Film session prep', 'Extra time'
  ));

-- Anyone can propose a shift for themselves — never for someone else, and
-- it must land in the 'proposed' state (admin approval turns it into a
-- normal 'accepted' shift via the existing shifts_admin_all_update policy).
create policy shifts_self_propose_insert on shifts
  for insert to authenticated
  with check (
    assignee_id = current_profile_id()
    and created_by = current_profile_id()
    and status = 'proposed'
  );

-- The proposer can withdraw their own proposal before it's decided —
-- once approved or declined it's an admin call (shifts_admin_delete).
create policy shifts_self_delete_proposed on shifts
  for delete to authenticated
  using (created_by = current_profile_id() and status = 'proposed');
