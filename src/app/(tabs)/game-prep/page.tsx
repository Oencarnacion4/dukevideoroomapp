import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAllProfiles, getCurrentProfile } from "@/lib/data/profiles";
import { listGameShifts } from "@/lib/data/shifts";
import { listGamePrepItems, listGameScouts } from "@/lib/data/game-prep";
import { distinctGames } from "@/lib/domain/games";
import { worksShifts } from "@/lib/domain/roles";
import { GamePrepView } from "@/components/game-prep/GamePrepView";

export default async function GamePrepPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) redirect("/sign-in");
  if (profile.role === "masters") redirect("/classes");

  const [crew, gameShifts, prepItems, scouts] = await Promise.all([
    getAllProfiles(supabase),
    listGameShifts(supabase),
    listGamePrepItems(supabase),
    listGameScouts(supabase),
  ]);

  const games = distinctGames(gameShifts);
  const assignableCrew = crew.filter((c) => worksShifts(c.role));
  const isAdmin = profile.role === "lead" || profile.role === "staff";
  const today = new Date().toISOString().slice(0, 10);

  return (
    <GamePrepView
      games={games}
      prepItems={prepItems}
      scouts={scouts}
      assignableCrew={assignableCrew}
      isAdmin={isAdmin}
      today={today}
    />
  );
}
