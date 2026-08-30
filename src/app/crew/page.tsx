import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAllProfiles, getCurrentProfile } from "@/lib/data/profiles";
import { listShifts } from "@/lib/data/shifts";
import { listAllAvailability } from "@/lib/data/availability";
import { getWeekStart } from "@/lib/domain/time";
import { initialsFor } from "@/lib/domain/shift-view";
import { OverlayHeader } from "@/components/chrome/OverlayHeader";
import { Tag } from "@/components/ui/Tag";
import { AddRosterForm } from "@/components/crew/AddRosterForm";

export default async function CrewPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile || (profile.role !== "lead" && profile.role !== "staff")) redirect("/today");

  const weekStart = getWeekStart();
  const [crew, shifts, availability] = await Promise.all([
    getAllProfiles(supabase),
    listShifts(supabase, weekStart),
    listAllAvailability(supabase),
  ]);

  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-(--color-bg)">
      <OverlayHeader eyebrow="Roster" title="The crew" variant="close" />
      <div className="flex flex-1 flex-col gap-4 p-4 pb-24">
        <p className="text-[13px] text-(--color-text-62)">
          Add names now, no email needed. When someone signs up with that name, their account attaches to
          this roster entry — shifts, hours and classes already waiting.
        </p>
        <Link href={`/crew/${profile.id}/classes`} className="text-[13px] font-medium text-(--color-accent-700)">
          My class schedule
        </Link>

        <div className="flex flex-col">
          {crew.map((c) => {
            const shiftCount = shifts.filter((s) => s.assignee_id === c.id).length;
            const blockCount = availability.filter((a) => a.profile_id === c.id).length;
            return (
              <Link
                key={c.id}
                href={`/crew/${c.id}/classes`}
                className="flex items-center gap-3 border-b border-(--color-divider) py-3 last:border-b-0"
              >
                <span className="flex h-7 w-7 items-center justify-center bg-(--color-accent-100) font-(family-name:--font-heading) text-[11px] text-(--color-accent-800)">
                  {initialsFor(c.full_name)}
                </span>
                <div className="flex-1">
                  <p className="text-[14px] font-medium">{c.full_name}</p>
                  <p className="text-[12px] text-(--color-text-50)">{c.email ?? "no email yet"}</p>
                  <p className="text-[11px] text-(--color-text-50)">
                    {shiftCount} shift{shiftCount === 1 ? "" : "s"} this week · {blockCount} block
                    {blockCount === 1 ? "" : "s"} on file
                  </p>
                </div>
                <Tag variant={c.auth_user_id ? "accent" : "outline"}>
                  {c.auth_user_id ? "Registered" : "Invite pending"}
                </Tag>
              </Link>
            );
          })}
        </div>
      </div>
      <div className="fixed right-0 bottom-0 left-0 mx-auto max-w-[480px] border-t border-(--color-divider) bg-(--color-bg) p-4">
        <AddRosterForm />
      </div>
    </div>
  );
}
