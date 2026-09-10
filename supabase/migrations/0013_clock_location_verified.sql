-- Tap-out was wrongly re-checking location, which meant someone who
-- forgot to tap out and already left had no way to close their session
-- at all short of walking back. The meaningful check is at tap-IN (are
-- you actually starting a session here); tap-out should always be able
-- to close it out. This column carries the tap-in's location result
-- forward to whenever the session finally gets logged, since tap-out no
-- longer checks location itself.
alter table profiles add column if not exists clock_location_verified boolean;
