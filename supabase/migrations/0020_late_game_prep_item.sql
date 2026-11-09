-- New checklist item: "Late game" (late-game/crunch-time sets), due the
-- same day as Blue Ribbon + folders, but only for Power 5 opponents. The
-- app has no conference data, so the Power 5 list below is a one-time
-- snapshot of the 2026-27 schedule — keep this in sync with
-- POWER5_OPPONENTS in src/lib/domain/games.ts if the schedule changes.

alter table game_prep_items drop constraint if exists game_prep_items_item_key_check;
alter table game_prep_items add constraint game_prep_items_item_key_check
  check (
    item_key in (
      'personnel_extendeds', 'select_clips', 'ato_bob_sob', 'blue_ribbon', 'late_game', 'recent_clips'
    )
  );

create or replace function send_game_prep_reminders() returns integer
  language plpgsql security definer set search_path = public as $$
declare
  sent_count integer := 0;
  rec record;
begin
  for rec in
    select gs.game_date, gs.opponent, gs.profile_id, k.item_key
    from game_scouts gs
    cross join (
      select 'personnel_extendeds' as item_key, 9 as remind_days_before
      union all select 'select_clips', 5
      union all select 'ato_bob_sob', 4
      union all select 'blue_ribbon', 4
      union all select 'late_game', 4
    ) as k
    left join game_prep_items gpi
      on gpi.game_date = gs.game_date and gpi.opponent = gs.opponent and gpi.item_key = k.item_key
    where gs.game_date - k.remind_days_before = current_date
      and coalesce(gpi.done, false) = false
      and gpi.reminder_sent_at is null
      and (
        k.item_key <> 'late_game'
        or gs.opponent in (
          'Georgia Tech', 'California', 'Syracuse', 'Pittsburgh', 'Stanford', 'Boston College',
          'Wake Forest', 'Notre Dame', 'Clemson', 'Miami', 'Virginia', 'SMU', 'North Carolina',
          'Florida State', 'Louisville', 'NC State',
          'Michigan State', 'Illinois', 'Florida', 'Georgia', 'Texas Tech',
          'UConn', 'Washington State', 'Gonzaga'
        )
      )
  loop
    perform create_notification(
      rec.profile_id,
      'Scouting reminder: ' || rec.opponent,
      (case rec.item_key
        when 'personnel_extendeds' then 'Personnel Extendeds'
        when 'select_clips' then 'Select clips'
        when 'ato_bob_sob' then 'ATOs/BOBs/SOBs'
        when 'blue_ribbon' then 'Blue Ribbon + folders'
        when 'late_game' then 'Late game'
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
