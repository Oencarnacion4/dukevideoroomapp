-- Same gap as 0006_grants.sql, repeated for the two tables 0017 added:
-- RLS policies restrict *which* rows a role can touch, but Postgres still
-- requires the underlying table-level GRANT before RLS is ever evaluated.
-- Without it every query on these tables fails with "permission denied",
-- regardless of how permissive the policies are.

grant select, insert, update, delete on
  game_scouts,
  game_prep_items
to authenticated;
