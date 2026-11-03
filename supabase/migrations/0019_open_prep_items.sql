-- The checklist is a shared crew job, not a solo one — anyone should be
-- able to check an item off to help whoever's assigned (e.g. help Graham
-- get something done), not just the assigned scout(s) or an admin.
-- Assigning who scouts a game stays admin-only (game_scouts is untouched).

drop policy if exists game_prep_items_insert on game_prep_items;
drop policy if exists game_prep_items_update on game_prep_items;

create policy game_prep_items_insert on game_prep_items
  for insert to authenticated
  with check (true);

create policy game_prep_items_update on game_prep_items
  for update to authenticated
  using (true);
