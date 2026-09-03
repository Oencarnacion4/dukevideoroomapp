import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAllProfiles, getCurrentProfile } from "@/lib/data/profiles";
import { listAllAvailabilityAnyKind } from "@/lib/data/availability";
import { resolveWeekParam } from "@/lib/domain/time";
import { toAvailabilityBlock } from "@/lib/domain/conflicts";
import { OverlayHeader } from "@/components/chrome/OverlayHeader";
import { CrewCalendarView } from "@/components/crew/CrewCalendarView";

export default async function CrewCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) redirect("/sign-in");

  const { week } = await searchParams;
  const weekStart = resolveWeekParam(week);
  const [crew, availability] = await Promise.all([getAllProfiles(supabase), listAllAvailabilityAnyKind(supabase)]);

  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-(--color-bg)">
      <OverlayHeader eyebrow="Crew" title="Who's busy & coming in" />
      <CrewCalendarView weekStart={weekStart} crew={crew} availability={availability.map(toAvailabilityBlock)} />
    </div>
  );
}
