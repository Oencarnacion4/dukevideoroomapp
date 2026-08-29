-- The register screen matches a typed name against the roster live, before
-- the visitor has an account — so it needs to read roster names while still
-- anonymous. profiles itself is locked to `authenticated` (see 0002_rls.sql),
-- so expose a narrow view with just what that screen needs: no email, no
-- role, nothing else.
--
-- This view intentionally bypasses RLS: it's owned by the same role as
-- `profiles` (which owns/bypasses RLS on its own table), so granting
-- select on the view to anon exposes exactly its two columns and nothing
-- from the underlying row-level policies.
create or replace view public_roster as
select id, full_name, (auth_user_id is not null) as claimed
from profiles;

grant select on public_roster to anon, authenticated;
