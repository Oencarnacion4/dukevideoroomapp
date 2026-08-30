import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAllProfiles, getCurrentProfile } from "@/lib/data/profiles";
import { listShifts } from "@/lib/data/shifts";
import { getAppSettings } from "@/lib/data/settings";
import { listTasksWithCompletion } from "@/lib/data/tasks";
import { listTimeEntriesFor, sumHours } from "@/lib/data/time-entries";
import { addDays, getWeekStart } from "@/lib/domain/time";
import { NextShiftCard } from "@/components/schedule/NextShiftCard";
import { HoursStrip } from "@/components/hours/HoursStrip";
import { TaskRow } from "@/components/tasks/TaskRow";
import { Card } from "@/components/ui/Card";
import { buttonClasses } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { tagVariant } from "@/lib/constants";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Morning";
  if (h < 18) return "Afternoon";
  return "Evening";
}

export default async function TodayPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) redirect("/sign-in");

  const weekStart = getWeekStart();
  const today = new Date().toISOString().slice(0, 10);

  const [weekShifts, crew, settings, tasks, myEntries] = await Promise.all([
    listShifts(supabase, weekStart),
    getAllProfiles(supabase),
    getAppSettings(supabase),
    listTasksWithCompletion(supabase, profile.id, today),
    profile.role === "staff" ? Promise.resolve([]) : listTimeEntriesFor(supabase, profile.id),
  ]);

  const myShifts = weekShifts.filter((s) => s.assignee_id === profile.id);
  const nextShift = myShifts
    .filter((s) => s.status !== "declined" && s.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time))[0];

  const pendingCount = myShifts.filter((s) => s.status === "pending").length;
  const acceptedCount = myShifts.filter((s) => s.status === "accepted").length;
  const statusLine =
    pendingCount > 0
      ? `${pendingCount} shift${pendingCount === 1 ? "" : "s"} still need your answer · ${acceptedCount} accepted`
      : `Week is settled — ${acceptedCount} shift${acceptedCount === 1 ? "" : "s"} accepted`;

  const candidates = crew
    .filter((c) => c.id !== profile.id)
    .map((c) => ({ id: c.id, full_name: c.full_name, shiftCount: weekShifts.filter((s) => s.assignee_id === c.id).length }));

  const dailyTasks = tasks.filter((t) => t.bucket === "daily");
  const dailyDone = dailyTasks.filter((t) => t.done).length;
  const coachTasks = tasks.filter((t) => t.bucket === "assigned" && !t.done).slice(0, 2);

  const weekEnd = addDays(weekStart, 7);
  const baseHours = profile.role === "staff" ? 0 : sumHours(myEntries, weekStart, weekEnd);

  const firstName = profile.full_name.split(" ")[0];
  const dateLabel = new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

  return (
    <div className="flex flex-1 flex-col gap-4.5 p-4 pb-6">
      <div>
        <p className="font-(family-name:--font-heading) text-[11px] font-medium tracking-[0.16em] text-(--color-accent-700) uppercase">
          {dateLabel}
        </p>
        <h3 className="font-(family-name:--font-heading) text-[24px] font-semibold">
          {greeting()}, {firstName}.
        </h3>
        <p className="text-[13px] text-(--color-text-62)">{statusLine}</p>
      </div>

      {nextShift ? (
        <NextShiftCard
          shift={nextShift}
          requireSwapOnDecline={settings.require_swap_on_decline}
          candidates={candidates}
        />
      ) : (
        <Card className="p-3.5 text-[13px] text-(--color-text-50)">No shifts on the calendar yet.</Card>
      )}

      <Link href="/practice" className={buttonClasses("primary", true, "h-[46px] text-[16px] tracking-[0.04em]")}>
        Start practice mode
      </Link>

      {profile.role !== "staff" && (
        <HoursStrip
          baseHours={baseHours}
          clockInAt={profile.clock_in_at}
          clockLabel={profile.clock_label}
          defaultLabel={nextShift?.session_type ?? "Video room"}
        />
      )}

      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <h5 className="font-(family-name:--font-heading) text-[16px] font-semibold">Daily checklist</h5>
          <span className="text-[13px] text-(--color-accent-700)">
            {dailyDone} of {dailyTasks.length}
          </span>
        </div>
        {dailyTasks.map((t) => (
          <TaskRow key={t.id} id={t.id} title={t.title} done={t.done} />
        ))}
      </div>

      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <h5 className="font-(family-name:--font-heading) text-[16px] font-semibold">From the coaches</h5>
          <Link href="/tasks" className="text-[13px] font-medium text-(--color-accent-700)">
            All tasks
          </Link>
        </div>
        <div className="flex flex-col gap-2">
          {coachTasks.map((t) => (
            <Card key={t.id} className="p-2.75">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[14px]">{t.title}</span>
                {t.tag && <Tag variant={tagVariant(t.tag)}>{t.tag}</Tag>}
              </div>
              <p className="mt-1 text-[11px] text-(--color-text-50)">
                {t.assigned_by} · {t.due_label}
              </p>
            </Card>
          ))}
          {coachTasks.length === 0 && (
            <p className="text-[13px] text-(--color-text-50)">Nothing outstanding from the coaches.</p>
          )}
        </div>
      </div>
    </div>
  );
}
