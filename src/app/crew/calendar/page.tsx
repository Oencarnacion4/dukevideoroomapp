import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAllProfiles, getCurrentProfile } from "@/lib/data/profiles";
import { listAllAvailabilityAnyKind } from "@/lib/data/availability";
import { listShifts } from "@/lib/data/shifts";
import { resolveWeekParam, pgTimeToLabel } from "@/lib/domain/time";
import { toAvailabilityBlock } from "@/lib/domain/conflicts";
import type { BusyShift } from "@/lib/domain/free-time";
import { OverlayHeader } from "@/components/chrome/OverlayHeader";
import { CrewCalendarView } from "@/components/crew/CrewCalendarView";
import { WhenFreeGrid } from "@/components/crew/WhenFreeGrid";
import { cn } from "@/lib/utils";

export default async function CrewCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; tab?: string }>;
}) {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) redirect("/sign-in");

  const { week, tab } = await searchParams;
  const weekStart = resolveWeekParam(week);
  const activeTab = tab === "free" ? "free" : "coming-in";

  const [crew, availability, shifts] = await Promise.all([
    getAllProfiles(supabase),
    listAllAvailabilityAnyKind(supabase),
    listShifts(supabase, weekStart),
  ]);

  const blocks = availability.map(toAvailabilityBlock);
  const busyBlocks = blocks.filter((b) => b.kind === "busy");
  const crewForFree = crew.filter((c) => c.role !== "staff");
  const busyShifts: BusyShift[] = shifts.map((s) => ({
    assignee_id: s.assignee_id,
    status: s.status,
    date: s.date,
    start_time: pgTimeToLabel(s.start_time),
    end_time: s.end_time ? pgTimeToLabel(s.end_time) : null,
    session_type: s.session_type,
  }));

  const tabClass = (tabId: string) =>
    cn(
      "flex-1 border border-(--color-divider) px-3 py-2 text-center text-[13px] font-medium",
      activeTab === tabId
        ? "bg-(--color-accent-800) text-white"
        : "bg-transparent text-(--color-text) hover:bg-(--color-accent-100)",
    );

  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-(--color-bg)">
      <OverlayHeader eyebrow="Crew" title="Who's busy & coming in" />
      <div className="flex gap-0 px-4 pt-3">
        <Link href={`/crew/calendar?tab=coming-in&week=${weekStart}`} className={cn(tabClass("coming-in"), "border-r-0")}>
          Coming in
        </Link>
        <Link href={`/crew/calendar?tab=free&week=${weekStart}`} className={tabClass("free")}>
          Find a time
        </Link>
      </div>
      {activeTab === "free" ? (
        <WhenFreeGrid weekStart={weekStart} crew={crewForFree} busyBlocks={busyBlocks} shifts={busyShifts} />
      ) : (
        <CrewCalendarView weekStart={weekStart} crew={crew} availability={blocks} />
      )}
    </div>
  );
}
