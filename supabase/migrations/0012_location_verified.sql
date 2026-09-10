-- Requiring a GPS reading to tap in turned out to be too much friction —
-- once a phone denies location permission there's no way to re-prompt it
-- short of digging through Settings, which isn't reasonable to expect from
-- the whole crew. A tap-in/out now always goes through; this column just
-- records whether the GPS reading at the time actually confirmed presence
-- at the Video Room, so a lead can still see the difference.
alter table time_entries add column if not exists location_verified boolean;
