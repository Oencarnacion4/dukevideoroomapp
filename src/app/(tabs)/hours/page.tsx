import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAllProfiles, getCurrentProfile } from "@/lib/data/profiles";
import { listShifts } from "@/lib/data/shifts";
import { listAllTimeEntries, listTimeEntriesFor, sumHours } from "@/lib/data/time-entries";
import { addDays, durationHours, formatWeekLabel, getWeekStart, pgTimeToLabel } from "@/lib/domain/time";
import { fmtHours, hoursVerdict, WEEKLY_CAP_HOURS, WEEKLY_MIN_HOURS } from "@/lib/domain/hours";
import { ClockControl } from "@/components/hours/ClockControl";
import { ProgressBar } from "@/components/hours/ProgressBar";
import { LogShiftRow } from "@/components/hours/LogShiftRow";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";

export default async function HoursPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) redirect("/sign-in");

  const isStaff = profile.role === "staff";
  const isAdmin = profile.role === "lead" || profile.role === "staff";
  const weekStart = getWeekStart();
  const weekEnd = addDays(weekStart, 7);

  const [weekShifts, myEntries, crew, allEntries] = await Promise.all([
    listShifts(supabase, weekStart),
    isStaff ? Promise.resolve([]) : listTimeEntriesFor(supabase, profile.id),
    isAdmin ? getAllProfiles(supabase) : Promise.resolve([]),
    isAdmin ? listAllTimeEntries(supabase) : Promise.resolve([]),
  ]);

  const total = isStaff ? 0 : sumHours(myEntries, weekStart, weekEnd);
  const myAccepted = weekShifts.filter((s) => s.assignee_id === profile.id && s.status === "accepted");
  const loggedLabels = new Set(myEntries.filter((e) => e.date >= weekStart && e.date < weekEnd).map((e) => e.session_label));
  const unlogged = myAccepted.filter((s) => !loggedLabels.has(s.session_type));

  const priorWeeks = [1, 2, 3].map((n) => {
    const start = addDays(weekStart, -7 * n);
    const end = addDays(start, 7);
    return { label: `${start} – ${end}`, hours: sumHours(myEntries, start, end) };
  });

  return (
    <div className="flex flex-1 flex-col gap-5 p-4 pb-6">
      <div>
        <h4 className="font-(family-name:--font-heading) text-[21px] font-semibold">
          {isStaff ? "Crew hours" : "Timesheet"}
        </h4>
        <p className="text-[13px] text-(--color-text-62)">
          {formatWeekLabel(weekStart)} · {isStaff ? "interns owe 10–15 hours" : "target 10–15 hours"}
        </p>
      </div>

      {!isStaff && (
        <Card blueprint className="flex flex-col gap-3 p-3.5">
          <div className="flex items-end justify-between">
            <span className="font-(family-name:--font-heading) text-[44px] leading-[0.9] font-semibold">
              {fmtHours(total)}
            </span>
            <span className="pb-1 text-[12px] text-(--color-text-50)">
              {total < WEEKLY_CAP_HOURS ? `Room for ${fmtHours(WEEKLY_CAP_HOURS - total)} more` : "Minimum 10 h · cap 15 h"}
            </span>
          </div>
          <ProgressBar hours={total} className="h-3" />
          <div className="flex justify-between text-[10px] uppercase text-(--color-text-50)">
            <span>0</span>
            <span>{WEEKLY_MIN_HOURS} min</span>
            <span>{WEEKLY_CAP_HOURS} cap</span>
          </div>
          <p className="text-[13px]">{hoursVerdict(total)}</p>
          <ClockControl
            clockInAt={profile.clock_in_at}
            clockLabel={profile.clock_label}
            defaultLabel="Video room"
            variant="timesheet"
          />
        </Card>
      )}

      {!isStaff && (
        <div>
          <h5 className="mb-2 font-(family-name:--font-heading) text-[16px] font-semibold">Entries</h5>
          <div className="flex flex-col">
            {myEntries
              .filter((e) => e.date >= weekStart && e.date < weekEnd)
              .map((e) => (
                <div key={e.id} className="flex items-center justify-between border-b border-(--color-divider) py-2 last:border-b-0">
                  <div className="w-13 text-[11px] uppercase text-(--color-text-50)">
                    {new Date(`${e.date}T00:00:00`).toLocaleDateString("en-US", { weekday: "short" })}
                  </div>
                  <div className="flex-1 text-[13.5px]">{e.session_label}</div>
                  <Tag variant="neutral" className="mr-2">
                    {e.source === "clocked" ? "Clocked" : "Manual"}
                  </Tag>
                  <div className="font-(family-name:--font-heading) text-[15px] font-semibold">{fmtHours(Number(e.hours))}</div>
                </div>
              ))}
            {myEntries.filter((e) => e.date >= weekStart && e.date < weekEnd).length === 0 && (
              <p className="py-3 text-[13px] text-(--color-text-50)">No entries yet this week.</p>
            )}
          </div>
        </div>
      )}

      {!isStaff && unlogged.length > 0 && (
        <div>
          <h5 className="mb-2 font-(family-name:--font-heading) text-[16px] font-semibold">Log a shift you worked</h5>
          <div className="flex flex-col gap-2">
            {unlogged.map((s) => (
              <LogShiftRow
                key={s.id}
                date={s.date}
                sessionLabel={s.session_type}
                startLabel={pgTimeToLabel(s.start_time)}
                hours={durationHours(pgTimeToLabel(s.start_time), s.end_time ? pgTimeToLabel(s.end_time) : null)}
              />
            ))}
          </div>
        </div>
      )}

      {isAdmin && (
        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <h5 className="font-(family-name:--font-heading) text-[16px] font-semibold">Everyone this week</h5>
            <span className="text-[13px] text-(--color-accent-700)">
              {crew.filter((c) => c.role !== "staff" && sumHours(allEntries.filter((e) => e.profile_id === c.id), weekStart, weekEnd) < WEEKLY_MIN_HOURS).length} under 10
            </span>
          </div>
          <div className="flex flex-col gap-2.5">
            {crew
              .filter((c) => c.role !== "staff")
              .map((c) => {
                const t = sumHours(allEntries.filter((e) => e.profile_id === c.id), weekStart, weekEnd);
                const status = t >= WEEKLY_CAP_HOURS ? "at cap" : t >= WEEKLY_MIN_HOURS ? "in range" : `${fmtHours(WEEKLY_MIN_HOURS - t)} short`;
                return (
                  <div key={c.id} className="flex items-center gap-2">
                    <span className="flex-1 text-[13.5px]">{c.full_name}</span>
                    <span className="font-(family-name:--font-heading) text-[15px] font-semibold">{fmtHours(t)}</span>
                    <span className={`w-14 text-right text-[11px] ${t < WEEKLY_MIN_HOURS ? "text-(--color-accent-900)" : "text-(--color-text-55)"}`}>
                      {status}
                    </span>
                    <ProgressBar hours={t} className="h-[7px] w-16" />
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {!isStaff && (
        <div>
          <h5 className="mb-2 font-(family-name:--font-heading) text-[16px] font-semibold">My earlier weeks</h5>
          <div className="flex flex-col gap-2">
            {priorWeeks.map((w) => (
              <div key={w.label} className="flex items-center gap-2">
                <span className="flex-1 text-[12.5px] text-(--color-text-62)">{w.label}</span>
                <span className="font-(family-name:--font-heading) text-[13px] font-semibold">{fmtHours(w.hours)}</span>
                <span className="text-[11px] text-(--color-text-50)">{w.hours >= WEEKLY_MIN_HOURS ? "met" : "under"}</span>
                <ProgressBar hours={w.hours} className="h-1.5 w-12" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
