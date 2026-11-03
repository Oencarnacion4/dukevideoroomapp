import { Card } from "@/components/ui/Card";
import { worksShifts } from "@/lib/domain/roles";
import { cn } from "@/lib/utils";
import type { GameStat } from "@/lib/domain/games";
import type { Profile } from "@/lib/types";

interface GamesLeaderboardProps {
  crew: Profile[];
  stats: Record<string, GameStat>;
  currentProfileId: string;
}

/** Everyone's claimed/worked game count, visible crew-wide so the load is easy to eyeball — not just something admins can see. */
export function GamesLeaderboard({ crew, stats, currentProfileId }: GamesLeaderboardProps) {
  const rows = crew
    .filter((c) => worksShifts(c.role))
    .map((c) => ({
      id: c.id,
      full_name: c.full_name,
      claimed: stats[c.id]?.claimed ?? 0,
      worked: stats[c.id]?.worked ?? 0,
    }))
    .sort((a, b) => b.claimed - a.claimed || a.full_name.localeCompare(b.full_name));

  const hasAnyGames = rows.some((r) => r.claimed > 0 || r.worked > 0);
  if (!hasAnyGames) return null;

  return (
    <Card blueprint className="flex flex-col gap-2.5 p-3.5">
      <span className="font-(family-name:--font-heading) text-[11px] font-medium uppercase tracking-[0.1em] text-(--color-accent-700)">
        Games this season
      </span>
      <div className="flex flex-col">
        {rows.map((r) => (
          <div
            key={r.id}
            className={cn(
              "flex items-center justify-between gap-2 border-b border-(--color-divider) py-1.5 last:border-b-0",
              r.id === currentProfileId && "font-medium",
            )}
          >
            <span className="text-[13px]">
              {r.full_name}
              {r.id === currentProfileId && " (you)"}
            </span>
            <span className="text-[12px] text-(--color-text-50)">
              {r.claimed} claimed · {r.worked} worked
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
