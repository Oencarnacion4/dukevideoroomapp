import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAllProfiles, getCurrentProfile } from "@/lib/data/profiles";
import { listGameShifts } from "@/lib/data/shifts";
import { listAllTimeEntries } from "@/lib/data/time-entries";
import { computeGameStats } from "@/lib/domain/games";
import { worksShifts } from "@/lib/domain/roles";
import { initialsFor } from "@/lib/domain/shift-view";
import { OverlayHeader } from "@/components/chrome/OverlayHeader";
import { cn } from "@/lib/utils";

export default async function GamesStatsPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) redirect("/sign-in");

  const [crew, gameShifts, timeEntries] = await Promise.all([
    getAllProfiles(supabase),
    listGameShifts(supabase),
    listAllTimeEntries(supabase),
  ]);
  const stats = computeGameStats(gameShifts, timeEntries);

  const rows = crew
    .filter((c) => worksShifts(c.role))
    .map((c) => ({
      id: c.id,
      full_name: c.full_name,
      claimed: stats[c.id]?.claimed ?? 0,
      worked: stats[c.id]?.worked ?? 0,
    }))
    .sort((a, b) => b.claimed - a.claimed || a.full_name.localeCompare(b.full_name));

  const isAdmin = profile.role === "lead" || profile.role === "staff";

  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-(--color-bg)">
      <OverlayHeader eyebrow="Schedule" title="Games this season" />
      <div className="flex flex-1 flex-col gap-3 p-4 pb-24">
        <p className="text-[13px] text-(--color-text-62)">
          Claimed is who signed up for a role. Worked is verified by an actual clock-in for that game.
        </p>

        <div className="flex flex-col">
          {rows.map((r) => (
            <div
              key={r.id}
              className={cn(
                "flex items-center gap-3 border-b border-(--color-divider) py-2.5 last:border-b-0",
                r.id === profile.id && "font-medium",
              )}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-(--color-accent-100) font-(family-name:--font-heading) text-[11px] text-(--color-accent-800)">
                {initialsFor(r.full_name)}
              </span>
              <span className="flex-1 text-[14px]">
                {r.full_name}
                {r.id === profile.id && " (you)"}
              </span>
              <span className="text-[12.5px] text-(--color-text-50)">
                {r.claimed} claimed · {r.worked} worked
              </span>
            </div>
          ))}
          {rows.length === 0 && (
            <p className="py-6 text-center text-[13px] text-(--color-text-50)">No games on the schedule yet.</p>
          )}
        </div>

        {isAdmin && (
          <Link href="/schedule/games/new" className="text-center text-[13px] font-medium text-(--color-accent-700)">
            Import season games
          </Link>
        )}
      </div>
    </div>
  );
}
