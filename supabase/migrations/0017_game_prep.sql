-- Pre-game scouting checklist: who's scouting each opponent, and the fixed
-- set of deliverables (personnel extendeds, select clips, ATOs/BOBs/SOBs,
-- Blue Ribbon + folders, optional recent-game clips) with deadlines
-- relative to game day. Keyed by (game_date, opponent) rather than a new
-- games table/FK — that's already how a "game" is uniquely identified
-- today (shifts.date + shifts.opponent), and this avoids having to
-- backfill or migrate any existing shift rows.

create table if not exists game_scouts (
  id uuid primary key default gen_random_uuid(),
  game_date date not null,
  opponent text not null,
  profile_id uuid not null references profiles (id) on delete cascade,
  assigned_by uuid not null references profiles (id),
  created_at timestamptz not null default now(),
  unique (game_date, opponent, profile_id)
);

create table if not exists game_prep_items (
  id uuid primary key default gen_random_uuid(),
  game_date date not null,
  opponent text not null,
  item_key text not null check (
    item_key in ('personnel_extendeds', 'select_clips', 'ato_bob_sob', 'blue_ribbon', 'recent_clips')
  ),
  done boolean not null default false,
  done_by uuid references profiles (id) on delete set null,
  done_at timestamptz,
  -- Set once a reminder notification has fired for this item, so the daily
  -- check never sends the same reminder twice.
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (game_date, opponent, item_key)
);

create index if not exists game_scouts_game_idx on game_scouts (game_date, opponent);
create index if not exists game_prep_items_game_idx on game_prep_items (game_date, opponent);

alter table game_scouts enable row level security;
alter table game_prep_items enable row level security;

-- Everyone can see who's scouting what and how prep is coming along —
-- this is exactly the crew-wide visibility the checklist is for.
create policy game_scouts_select on game_scouts for select to authenticated using (true);
create policy game_prep_items_select on game_prep_items for select to authenticated using (true);

-- Only admins assign/unassign scouts — matches the existing whiteboard
-- process where staff picks who scouts each opponent.
create policy game_scouts_admin_write on game_scouts
  for all to authenticated
  using (current_role_name() in ('lead', 'staff'))
  with check (current_role_name() in ('lead', 'staff'));

-- A prep item's row doesn't exist until its first toggle (upsert) — there's
-- no bulk pre-creation step, so this also covers games imported before this
-- feature existed. Same rule as update: the assigned scout(s), or an admin.
create policy game_prep_items_insert on game_prep_items
  for insert to authenticated
  with check (
    current_role_name() in ('lead', 'staff')
    or exists (
      select 1 from game_scouts gs
      where gs.game_date = game_prep_items.game_date
        and gs.opponent = game_prep_items.opponent
        and gs.profile_id = current_profile_id()
    )
  );

create policy game_prep_items_update on game_prep_items
  for update to authenticated
  using (
    current_role_name() in ('lead', 'staff')
    or exists (
      select 1 from game_scouts gs
      where gs.game_date = game_prep_items.game_date
        and gs.opponent = game_prep_items.opponent
        and gs.profile_id = current_profile_id()
    )
  );

-- ---------------------------------------------------------------------
-- Daily reminder sweep — called by the app's /api/cron route, which has
-- no signed-in user (a scheduled trigger, not a browser session). SECURITY
-- DEFINER means its internal reads/writes run as the function's owner
-- regardless, so it works the same whether the caller is anon or
-- authenticated. Notifies each assigned scout once per item, a day or two
-- ahead of that item's deadline, and never repeats once reminder_sent_at
-- is set (or the item's already done).
-- ---------------------------------------------------------------------
create or replace function send_game_prep_reminders() returns integer
  language plpgsql security definer set search_path = public as $$
declare
  sent_count integer := 0;
  rec record;
begin
  -- Cross every assigned scout with the 4 deadline-bearing items (not the
  -- optional recent_clips one), left-joining whatever game_prep_items row
  -- happens to exist so a never-toggled item still reads as "not done, no
  -- reminder sent yet" rather than being invisible to this sweep.
  for rec in
    select gs.game_date, gs.opponent, gs.profile_id, k.item_key
    from game_scouts gs
    cross join (
      values
        ('personnel_extendeds', 9),
        ('select_clips', 5),
        ('ato_bob_sob', 4),
        ('blue_ribbon', 4)
    ) as k(item_key, remind_days_before)
    left join game_prep_items gpi
      on gpi.game_date = gs.game_date and gpi.opponent = gs.opponent and gpi.item_key = k.item_key
    where gs.game_date - k.remind_days_before = current_date
      and coalesce(gpi.done, false) = false
      and gpi.reminder_sent_at is null
  loop
    perform create_notification(
      rec.profile_id,
      'Scouting reminder: ' || rec.opponent,
      (case rec.item_key
        when 'personnel_extendeds' then 'Personnel Extendeds'
        when 'select_clips' then 'Select clips'
        when 'ato_bob_sob' then 'ATOs/BOBs/SOBs'
        when 'blue_ribbon' then 'Blue Ribbon + folders'
      end) || ' is due soon — vs. ' || rec.opponent || ' on ' || to_char(rec.game_date, 'Mon DD') || '.'
    );

    insert into game_prep_items (game_date, opponent, item_key, reminder_sent_at)
    values (rec.game_date, rec.opponent, rec.item_key, now())
    on conflict (game_date, opponent, item_key) do update set reminder_sent_at = now();

    sent_count := sent_count + 1;
  end loop;

  return sent_count;
end;
$$;

-- Called from the app's /api/cron route, which has no signed-in user (a
-- scheduled trigger, not a browser session) and so runs as the anon
-- PostgREST role rather than authenticated. Safe to expose this broadly:
-- SECURITY DEFINER already does all the real table access internally, the
-- function takes no input, and it's naturally idempotent per day via
-- reminder_sent_at — calling it twice just does nothing the second time.
revoke execute on function send_game_prep_reminders() from public;
grant execute on function send_game_prep_reminders() to anon, authenticated;
