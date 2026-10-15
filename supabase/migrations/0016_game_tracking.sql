-- Game-day tracking: who's covering minutes/stats/offense-defense for each
-- game, and a reliable "games actually worked" count (vs. just who signed
-- up) for keeping the load fair across the crew.

alter table shifts add column if not exists opponent text;
alter table shifts add column if not exists home_away text check (home_away in ('home', 'away', 'neutral'));

-- Links a clocked session to the specific shift it was for — needed to
-- count "games worked" from real clock-ins rather than just who claimed a
-- slot. Nullable: only set for game shifts; every other clock-in/manual
-- entry leaves this null, same as today.
alter table time_entries add column if not exists shift_id uuid references shifts (id) on delete set null;

-- Carries the chosen shift through an active clock-in, same pattern as
-- clock_label/clock_source — set at clock-in, copied onto the logged
-- time_entries row at clock-out, then cleared.
alter table profiles add column if not exists clock_shift_id uuid references shifts (id) on delete set null;
