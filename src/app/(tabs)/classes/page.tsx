import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/profiles";
import { listAvailabilityFor } from "@/lib/data/availability";
import { formatShortDate, pgTimeToLabel } from "@/lib/domain/time";
import { Tag } from "@/components/ui/Tag";
import { DayOffCard } from "@/components/availability/DayOffCard";

export default async function ClassesPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) redirect("/sign-in");

  const blocks = await listAvailabilityFor(supabase, profile.id);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pb-6">
      <div>
        <h4 className="font-(family-name:--font-heading) text-[21px] font-semibold">My availability</h4>
        <p className="text-[12px] text-(--color-text-50)">{profile.email}</p>
        <p className="mt-1 text-[13px] text-(--color-text-62)">
          Classes and days you cannot work. Staff see a conflict warning before they assign you.
        </p>
      </div>

      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <h5 className="font-(family-name:--font-heading) text-[16px] font-semibold">Blocked time</h5>
          <Link href={`/crew/${profile.id}/classes`} className="text-[13px] font-medium text-(--color-accent-700)">
            Add classes
          </Link>
        </div>
        <div className="flex flex-col">
          {blocks.map((b) => (
            <div key={b.id} className="flex items-center gap-3 border-b border-(--color-divider) py-2.5 last:border-b-0">
              <span className="w-11 shrink-0 font-(family-name:--font-heading) text-[12px] font-medium uppercase text-(--color-accent-700)">
                {b.specific_date ? formatShortDate(b.specific_date) : b.day_of_week}
              </span>
              <div className="flex-1">
                <p className="text-[14px]">{b.label}</p>
                <p className="text-[11.5px] text-(--color-text-50)">
                  {b.all_day ? "All day — cannot work" : `${pgTimeToLabel(b.start_time!)} – ${pgTimeToLabel(b.end_time!)}`}
                </p>
              </div>
              <Tag variant="neutral">{b.specific_date ? "One-time" : b.all_day ? "Day off" : "Class"}</Tag>
            </div>
          ))}
          {blocks.length === 0 && (
            <div className="border border-(--color-divider) p-4 text-center text-[13px] text-(--color-text-50)">
              Nothing blocked yet — every hour of the week is open.
            </div>
          )}
        </div>
      </div>

      <DayOffCard profileId={profile.id} />
    </div>
  );
}
