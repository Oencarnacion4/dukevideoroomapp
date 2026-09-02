import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAllProfiles, getCurrentProfile } from "@/lib/data/profiles";
import { listAllAvailabilityAnyKind } from "@/lib/data/availability";
import { dayOfWeekFor, getWeekStart } from "@/lib/domain/time";
import { toAvailabilityBlock } from "@/lib/domain/conflicts";
import { OverlayHeader } from "@/components/chrome/OverlayHeader";
import { CrewCalendarView } from "@/components/crew/CrewCalendarView";

export default async function CrewCalendarPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile || (profile.role !== "lead" && profile.role !== "staff")) redirect("/today");

  const weekStart = getWeekStart();
  const [crew, availability] = await Promise.all([getAllProfiles(supabase), listAllAvailabilityAnyKind(supabase)]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-(--color-bg)">
      <OverlayHeader eyebrow="Crew" title="Who's busy & coming in" />
      <CrewCalendarView
        weekStart={weekStart}
        crew={crew}
        availability={availability.map(toAvailabilityBlock)}
        defaultDay={dayOfWeekFor(today)}
      />
    </div>
  );
}
