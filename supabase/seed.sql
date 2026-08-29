-- Demo seed data, ported verbatim (copy and structure) from the prototype's
-- Component class in design/Video Room.dc.html — SHIFTS, availability,
-- TASKS, GUIDES/STEPS. Run after 0001-0003 migrations, in the Supabase
-- SQL Editor.
--
-- This is meant to be run ONCE against a fresh project. The roster insert
-- is safe to re-run (guarded by profiles_unclaimed_name_idx); everything
-- else below is not — re-running after real shifts/tasks/guides exist
-- will add duplicate demo rows. Delete this content once the real season
-- starts, or don't run it at all if you'd rather start from an empty crew.

-- ---------------------------------------------------------------------
-- Roster — name-only, unclaimed. Whoever signs up as "Jordan R." (etc.)
-- via /register attaches to these and inherits the demo data below.
-- Adjust the role assignment before running if a different person should
-- be the head intern.
-- ---------------------------------------------------------------------
insert into profiles (full_name, role)
values
  ('Jordan R.', 'lead'),
  ('Maya P.', 'intern'),
  ('Tre W.', 'intern'),
  ('Sam K.', 'intern'),
  ('Devin L.', 'intern'),
  ('Ana G.', 'intern')
on conflict (full_name) where auth_user_id is null do nothing;

-- ---------------------------------------------------------------------
-- Shifts for "this week" (Monday-anchored, so the demo always looks current)
-- ---------------------------------------------------------------------
with base as (
  select date_trunc('week', current_date)::date as monday
),
lead_profile as (
  select id from profiles where full_name = 'Jordan R.' and auth_user_id is null limit 1
),
shift_data (dow_offset, dow, start_t, end_t, session, camera_role, location, who, status, note) as (
  values
    (0, 'Mon', '1:30 PM'::time, null::time, 'Full practice', 'Baseline cam', 'Practice court', 'Jordan R.', 'pending', null),
    (1, 'Tue', '6:00 AM'::time, '7:15 AM'::time, 'Early lift', 'Floor cam', 'Weight room', 'Maya P.', 'accepted', null),
    (1, 'Tue', '3:00 PM'::time, '5:45 PM'::time, 'Full practice', 'Baseline cam', 'Practice court', 'Jordan R.', 'accepted', 'Have to leave 30 min early — class at 6.'),
    (2, 'Wed', '4:15 PM'::time, '6:15 PM'::time, 'Half-court work', 'Corner cam', 'Practice court', 'Tre W.', 'pending', null),
    (3, 'Thu', '11:00 AM'::time, '12:30 PM'::time, 'Individual workouts', 'Handheld', 'Auxiliary gym', 'Jordan R.', 'pending', null),
    (4, 'Fri', '2:00 PM'::time, '4:30 PM'::time, 'Full practice', 'Baseline cam', 'Practice court', 'Sam K.', 'accepted', null),
    (5, 'Sat', '10:00 AM'::time, '1:00 PM'::time, 'Live scrimmage', 'Baseline + corner', 'Main arena', 'Jordan R.', 'swap_sent', null),
    (6, 'Sun', '7:00 PM'::time, '8:00 PM'::time, 'Film session prep', 'Editing bay', 'Video room', 'Ana G.', 'accepted', null)
)
insert into shifts (day_of_week, date, start_time, end_time, session_type, camera_role, location, assignee_id, status, note, created_by)
select sd.dow, base.monday + sd.dow_offset, sd.start_t, sd.end_t, sd.session, sd.camera_role, sd.location,
       p.id, sd.status, sd.note, lead_profile.id
from shift_data sd
  cross join base
  cross join lead_profile
  join profiles p on p.full_name = sd.who and p.auth_user_id is null;

-- One open slot alongside the assigned shifts, so "Claim this slot" has
-- something to show.
insert into shifts (day_of_week, date, start_time, end_time, session_type, camera_role, location, assignee_id, status, created_by)
select 'Wed', base_wed.monday, '4:15 PM'::time, null, 'Full practice', 'Handheld', 'Practice court', null, 'open', lead_profile.id
from (select date_trunc('week', current_date)::date + 2 as monday) base_wed
  cross join (select id from profiles where full_name = 'Jordan R.' and auth_user_id is null limit 1) lead_profile;

-- ---------------------------------------------------------------------
-- Availability — class times, ported from the prototype's `avail` map
-- ---------------------------------------------------------------------
with avail_data (who, dow, start_t, end_t, label) as (
  values
    ('Jordan R.', 'Tue', '6:00 PM'::time, '7:15 PM'::time, 'PSY 105'),
    ('Jordan R.', 'Thu', '9:30 AM'::time, '10:45 AM'::time, 'MATH 216'),
    ('Maya P.', 'Mon', '9:00 AM'::time, '10:15 AM'::time, 'STAT 210'),
    ('Maya P.', 'Wed', '9:00 AM'::time, '10:15 AM'::time, 'STAT 210'),
    ('Maya P.', 'Tue', '3:00 PM'::time, '4:30 PM'::time, 'HIST 180'),
    ('Tre W.', 'Wed', '4:00 PM'::time, '5:30 PM'::time, 'ECON 101'),
    ('Tre W.', 'Fri', '1:00 PM'::time, '2:30 PM'::time, 'BIO lab'),
    ('Sam K.', 'Mon', '1:00 PM'::time, '2:15 PM'::time, 'CHEM 110'),
    ('Ana G.', 'Sun', '7:00 PM'::time, '8:00 PM'::time, 'Study group')
)
insert into availability (profile_id, day_of_week, start_time, end_time, all_day, label)
select p.id, ad.dow, ad.start_t, ad.end_t, false, ad.label
from avail_data ad
join profiles p on p.full_name = ad.who and p.auth_user_id is null;

-- ---------------------------------------------------------------------
-- Time entries — Jordan R.'s clocked/manual logs this week, plus a
-- lump-sum "this week" entry for everyone else's demo hours total
-- (the prototype only stores an aggregate per person, not a breakdown).
-- ---------------------------------------------------------------------
with base as (
  select date_trunc('week', current_date)::date as monday
),
jordan as (
  select id from profiles where full_name = 'Jordan R.' and auth_user_id is null limit 1
),
entry_data (dow_offset, session, hours, source) as (
  values
    (0, 'Full practice', 3.25, 'clocked'),
    (1, 'Early lift + edit', 2.5, 'clocked'),
    (2, 'Editing bay', 1.75, 'manual'),
    (3, 'Individual workouts', 1.5, 'clocked')
)
insert into time_entries (profile_id, date, session_label, hours, source)
select jordan.id, base.monday + ed.dow_offset, ed.session, ed.hours, ed.source
from entry_data ed cross join base cross join jordan;

with base as (
  select date_trunc('week', current_date)::date as monday
),
crew_totals (who, hours) as (
  values ('Maya P.', 11.5), ('Tre W.', 8.25), ('Sam K.', 13.0), ('Devin L.', 4.5), ('Ana G.', 10.75)
)
insert into time_entries (profile_id, date, session_label, hours, source)
select p.id, base.monday, 'This week (demo total)', ct.hours, 'manual'
from crew_totals ct cross join base
join profiles p on p.full_name = ct.who and p.auth_user_id is null;

-- ---------------------------------------------------------------------
-- Tasks, ported verbatim from the prototype's TASKS array. The 'mine'
-- bucket becomes 'personal', scoped to whoever claims the Jordan R. entry.
-- ---------------------------------------------------------------------
with jordan as (
  select id from profiles where full_name = 'Jordan R.' and auth_user_id is null limit 1
),
task_data (bucket, title, assigned_by, due_label, tag) as (
  values
    ('assigned', 'Cut Tuesday practice into segments, upload before film', 'Coach Vance', 'Due Sun 6 PM', 'Priority'),
    ('assigned', 'Build 4-min transition reel for Monday walkthrough', 'Coach Ellis', 'Due Mon 9 AM', 'Priority'),
    ('assigned', 'Re-tag last season ball-screen clips with new labels', 'Coach Vance', 'No date', 'Backlog'),
    ('assigned', 'Pull individual highlight cuts for the two new guards', 'Coach Ruiz', 'Due Wed', 'Normal'),
    ('daily', 'Charge all camera + recorder batteries', 'Daily', 'Before 11 AM', 'Daily'),
    ('daily', 'Confirm practice time in the staff thread', 'Daily', 'Morning', 'Daily'),
    ('daily', 'Clear yesterday''s cards, verify backup finished', 'Daily', 'Morning', 'Daily'),
    ('daily', 'Check editing bay drives have 200GB+ free', 'Daily', 'Anytime', 'Daily'),
    ('daily', 'Post the day''s shift assignments to the board', 'Daily', 'Morning', 'Daily'),
    ('practice', 'Cameras up and framed 20 min before first whistle', 'Practice', 'Pre-practice', 'Setup'),
    ('practice', 'Slate the recording with date + session type', 'Practice', 'Start', 'Setup'),
    ('practice', 'Mark segment breaks live as coaches call them', 'Practice', 'Ongoing', 'Live'),
    ('practice', 'Flag anything a coach says to "pull that one"', 'Practice', 'Ongoing', 'Live'),
    ('post', 'Offload both cards, verify frame counts match', 'Post', 'Within 30 min', 'Required'),
    ('post', 'Push practice file to the shared drive + Hudl', 'Post', 'Same day', 'Required'),
    ('post', 'Log the session in the practice index sheet', 'Post', 'Same day', 'Normal'),
    ('post', 'Wrap cables, lock the cage, cards back in the bin', 'Post', 'Before leaving', 'Required'),
    ('game', 'Confirm arena feed + tripod positions with ops', 'Game day', 'Gameday -4h', 'Game'),
    ('game', 'Test the bench iPad tagging setup end to end', 'Game day', 'Gameday -2h', 'Game'),
    ('game', 'Deliver first-half cut to staff at halftime', 'Game day', 'Halftime', 'Priority')
)
insert into tasks (bucket, title, assigned_by, due_label, tag)
select bucket, title, assigned_by, due_label, tag from task_data;

insert into tasks (bucket, title, assigned_by, due_label, tag, owner_id)
select 'personal', title, assigned_by, due_label, tag, jordan.id
from jordan,
  (values
    ('Ask Coach Ellis about the new tagging shortcuts', 'Personal', 'Whenever', 'Note'),
    ('Rewatch the export-presets how-to before Friday', 'Personal', 'By Fri', 'Note')
  ) as t(title, assigned_by, due_label, tag);

-- A few tasks already checked off today, for demo texture.
insert into task_completions (task_id, profile_id, completed_on)
select t.id, jordan.id, current_date
from tasks t, jordan
where t.title in (
  'Re-tag last season ball-screen clips with new labels',
  'Clear yesterday''s cards, verify backup finished',
  'Slate the recording with date + session type'
);

-- ---------------------------------------------------------------------
-- How-to guides + steps, ported verbatim (kicker/title/intro/credit and
-- every step's title/body) from the prototype's GUIDES and STEPS.
-- ---------------------------------------------------------------------
with guide_data (author, kicker, title, format, intro) as (
  values
    ('Maya P.', 'Hardware', 'Baseline camera setup, start to finish', 'written',
     'The baseline rig is the one every coach watches, so it gets set the same way every single day. Twenty minutes before first whistle, no exceptions.'),
    ('Tre W.', 'Software', 'Tagging a practice in the editor', 'video',
     'Screen recording of a full practice tag pass, real time, no cuts. Watch it once before your first solo practice.'),
    ('Sam K.', 'Software', 'Export presets for staff vs players', 'written',
     'Staff cuts and player cuts leave with different presets. Sending the wrong one is the most common mistake in this room.'),
    ('Ana G.', 'Workflow', 'Card offload and backup verification', 'written',
     'Nothing gets deleted until two copies exist and the frame counts match. This is the one procedure with no shortcuts.'),
    ('Devin L.', 'Software', 'Uploading to the shared drive + Hudl', 'video',
     'Where files go, how they get named, and what to do when an upload stalls at 90 percent.'),
    ('Jordan R.', 'Hardware', 'Bench iPad tagging setup for games', 'written',
     'Game day only. The bench setup rides on arena wifi, so it gets tested twice: four hours out and two hours out.')
),
inserted as (
  insert into guides (author_id, kicker, title, format, intro)
  select p.id, gd.kicker, gd.title, gd.format, gd.intro
  from guide_data gd
  join profiles p on p.full_name = gd.author and p.auth_user_id is null
  returning id, title
),
step_data (title, position, step_title, step_body) as (
  values
    ('Baseline camera setup, start to finish', 1, 'Pull rig 4 from the cage', 'Rig 4 is the baseline body. Check the lens is the 24-70 and the battery reads full before you leave the cage.'),
    ('Baseline camera setup, start to finish', 2, 'Set the tripod on the baseline mark', 'Tape mark is 6 feet right of the stanchion. Legs at second notch, head level, plate locked.'),
    ('Baseline camera setup, start to finish', 3, 'Frame both free-throw lines', 'Wide enough that both lines sit inside the frame with a foot of air above the rim.'),
    ('Baseline camera setup, start to finish', 4, 'Settings: 1080/60, shutter 1/120', 'Manual exposure. Practice-court lights do not change, so lock it and leave it.'),
    ('Baseline camera setup, start to finish', 5, 'Card check and record test', 'Fresh card, 10-second test, play it back on the body. Do not trust the record light alone.'),
    ('Baseline camera setup, start to finish', 6, 'Slate and roll', 'Roll before players are on the floor. Extra footage is free; missing the first drill is not.'),

    ('Tagging a practice in the editor', 1, 'Open the practice file in the tagging window', 'It lands in the day folder automatically once the offload finishes.'),
    ('Tagging a practice in the editor', 2, 'Set your segment hotkeys', 'The room uses 1 through 6 for shell, closeouts, transition, live, special, and free throws.'),
    ('Tagging a practice in the editor', 3, 'Tag in one pass, clean up after', 'Do not stop to fix a mistag mid-pass. Note the timecode and come back.'),
    ('Tagging a practice in the editor', 4, 'Name segments the way coaches search', 'Drill name first, then personnel. That is how they type it into search.'),

    ('Export presets for staff vs players', 1, 'Pick the audience preset first', 'Staff preset keeps full audio and full length. Player preset trims audio and caps each clip at 90 seconds.'),
    ('Export presets for staff vs players', 2, 'Check the bitrate before you queue', 'Staff at 20 Mbps, player at 8. Anything higher clogs the upload.'),
    ('Export presets for staff vs players', 3, 'Name the file to the room convention', 'YYYY-MM-DD_session_audience. The date leads so folders sort themselves.'),
    ('Export presets for staff vs players', 4, 'Queue, then verify the first 10 seconds', 'Play the exported file. A silent staff cut has to be caught here, not by a coach.'),

    ('Card offload and backup verification', 1, 'Card into the reader, never the camera', 'Camera offloads are slow and drain the battery mid-transfer.'),
    ('Card offload and backup verification', 2, 'Copy to the day folder on the working drive', 'Copy, do not move. The card stays intact until step 4 passes.'),
    ('Card offload and backup verification', 3, 'Mirror to the backup drive', 'Same folder name, second drive. Both copies exist before anything gets deleted.'),
    ('Card offload and backup verification', 4, 'Compare frame counts on both copies', 'Counts match or you copy again. This is the check that saves practices.'),
    ('Card offload and backup verification', 5, 'Format the card in-camera, log it', 'Format in the body, not the computer. Initial the card log on the wall.'),

    ('Uploading to the shared drive + Hudl', 1, 'Drop the export into the upload watch folder', 'The watch folder handles the shared drive push on its own.'),
    ('Uploading to the shared drive + Hudl', 2, 'Upload to Hudl second, not first', 'Shared drive is the source of truth. Hudl is the distribution copy.'),
    ('Uploading to the shared drive + Hudl', 3, 'Confirm the staff notification went out', 'If the thread stays quiet, the upload did not finish. Check before you leave.'),

    ('Bench iPad tagging setup for games', 1, 'Pair the iPad to arena wifi, not the practice network', 'Different network in the arena. Pair it four hours out while ops is still around.'),
    ('Bench iPad tagging setup for games', 2, 'Connect to the tagging session', 'Session name is the opponent and date. Join as a tagger, not a viewer.'),
    ('Bench iPad tagging setup for games', 3, 'Run a two-minute live test with the truck feed', 'Tag something, confirm it lands upstairs. Do not assume.'),
    ('Bench iPad tagging setup for games', 4, 'Charge and stage the backup iPad', 'Second iPad lives in the bench bag, charged, already joined.'),
    ('Bench iPad tagging setup for games', 5, 'Halftime handoff', 'Whoever is upstairs cuts the first-half reel. Bench tagger keeps tagging.')
)
insert into guide_steps (guide_id, position, title, body)
select ins.id, sd.position, sd.step_title, sd.step_body
from step_data sd
join inserted ins on ins.title = sd.title;
