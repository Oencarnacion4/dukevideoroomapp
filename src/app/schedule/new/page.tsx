import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAllProfiles, getCurrentProfile } from "@/lib/data/profiles";
import { listAllAvailability } from "@/lib/data/availability";
import { listShifts } from "@/lib/data/shifts";
import { resolveWeekParam } from "@/lib/domain/time";
import { toAvailabilityBlock } from "@/lib/domain/conflicts";
import { ShiftBuilderForm } from "@/components/schedule/ShiftBuilderForm";

export default async function NewShiftPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; open?: string }>;
}) {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile || (profile.role !== "lead" && profile.role !== "staff")) redirect("/today");

  const { week } = await searchParams;
  const weekStart = resolveWeekParam(week);
  const [allProfiles, availability, shifts] = await Promise.all([
    getAllProfiles(supabase),
    listAllAvailability(supabase),
    listShifts(supabase, weekStart),
  ]);

  const crew = allProfiles.filter((p) => p.id !== profile.id);
  const shiftCounts: Record<string, number> = {};
  for (const s of shifts) {
    if (s.assignee_id) shiftCounts[s.assignee_id] = (shiftCounts[s.assignee_id] ?? 0) + 1;
  }

  return (
    <ShiftBuilderForm
      weekStart={weekStart}
      crew={crew}
      availability={availability.map(toAvailabilityBlock)}
      shiftCounts={shiftCounts}
    />
  );
}
