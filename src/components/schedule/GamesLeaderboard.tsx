import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { worksShifts } from "@/lib/domain/roles";
import type { GameStat } from "@/lib/domain/games";
import type { Profile } from "@/lib/types";

interface GamesLeaderboardProps {
  crew: Profile[];
  stats: Record<string, GameStat>;
  currentProfileId: string;
}

/**
 * One compact row linking to the full breakdown, instead of listing the
 * whole crew inline — a season-long stat doesn't need to compete with this
 * week's shifts for space every time the schedule opens.
 */
export function GamesLeaderboard({ crew, stats, currentProfileId }: GamesLeaderboardProps) {
  const eligible = crew.filter((c) => worksShifts(c.role));
  const hasAnyGames = eligible.some((c) => (stats[c.id]?.claimed ?? 0) > 0 || (stats[c.id]?.worked ?? 0) > 0);
  if (!hasAnyGames) return null;

  const mine = stats[currentProfileId];

  return (
    <Link
      href="/schedule/games"
      className="flex items-center justify-between border border-(--color-divider) px-3 py-2.5 text-[13px]"
    >
      <span className="font-medium">Games this season</span>
      <span className="flex items-center gap-1 text-(--color-text-50)">
        You: {mine?.claimed ?? 0} claimed · {mine?.worked ?? 0} worked
        <ChevronRight size={14} strokeWidth={1.5} />
      </span>
    </Link>
  );
}
