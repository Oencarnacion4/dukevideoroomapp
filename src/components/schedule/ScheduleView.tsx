"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { Seg } from "@/components/ui/Seg";
import { buttonClasses } from "@/components/ui/Button";
import { ShiftCard } from "@/components/schedule/ShiftCard";
import { DAYS, addDays, formatWeekLabel } from "@/lib/domain/time";
import { cn } from "@/lib/utils";
import type { ShiftWithAssignee } from "@/lib/data/shifts";
import type { AvailabilityBlock } from "@/lib/domain/conflicts";
import type { DayOfWeek, Profile } from "@/lib/types";

interface ScheduleViewProps {
  weekStart: string;
  shifts: ShiftWithAssignee[];
  profile: Profile;
  crew: Profile[];
  availability: AvailabilityBlock[];
  requireSwapOnDecline: boolean;
}

export function ScheduleView({
  weekStart,
  shifts,
  profile,
  crew,
  availability,
  requireSwapOnDecline,
}: ScheduleViewProps) {
  const isAdmin = profile.role === "lead" || profile.role === "staff";
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | null>(null);
  const [scope, setScope] = useState<"week" | "mine">("week");

  const dayDates = DAYS.map((_, i) => addDays(weekStart, i));
  const prevWeek = addDays(weekStart, -7);
  const nextWeek = addDays(weekStart, 7);

  const candidates = crew
    .filter((c) => c.id !== profile.id)
    .map((c) => ({
      id: c.id,
      full_name: c.full_name,
      shiftCount: shifts.filter((s) => s.assignee_id === c.id).length,
    }));

  // Unlike swap candidates, assigning an open slot can include yourself —
  // the head intern works shifts too.
  const assignableCrew = crew.map((c) => ({
    id: c.id,
    full_name: c.id === profile.id ? `${c.full_name} (you)` : c.full_name,
    shiftCount: shifts.filter((s) => s.assignee_id === c.id).length,
  }));

  const visible = useMemo(() => {
    return shifts.filter((s) => {
      if (selectedDay && s.day_of_week !== selectedDay) return false;
      if (scope === "mine" && s.assignee_id !== profile.id) return false;
      return true;
    });
  }, [shifts, selectedDay, scope, profile.id]);

  // Shifts covering the same slot (same date/time/session/location) render
  // as one card listing everyone on it, instead of a separate card each.
  const groups = useMemo(() => {
    const map = new Map<string, ShiftWithAssignee[]>();
    for (const s of visible) {
      const key = `${s.date}|${s.start_time}|${s.end_time ?? ""}|${s.session_type}|${s.location}`;
      const group = map.get(key);
      if (group) group.push(s);
      else map.set(key, [s]);
    }
    return Array.from(map.values());
  }, [visible]);

  const accepted = shifts.filter((s) => s.assignee_id === profile.id && s.status === "accepted").length;
  const pending = shifts.filter((s) => s.assignee_id === profile.id && s.status === "pending").length;

  const awaitingReply = shifts.filter((s) => s.status === "pending").length;
  const unclaimed = shifts.filter((s) => s.status === "open").length;
  const interns = crew.filter((c) => c.role === "intern");
  const notSignedUp = interns.filter((c) => !shifts.some((s) => s.assignee_id === c.id)).length;

  return (
    <div className="flex flex-1 flex-col gap-3.5 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Link
            href={`/schedule?week=${prevWeek}`}
            aria-label="Previous week"
            className="flex h-8 w-8 items-center justify-center border border-(--color-divider)"
          >
            <ChevronLeft size={16} strokeWidth={1.5} />
          </Link>
          <h4 className="font-(family-name:--font-heading) text-[21px] font-semibold">
            {formatWeekLabel(weekStart)}
          </h4>
          <Link
            href={`/schedule?week=${nextWeek}`}
            aria-label="Next week"
            className="flex h-8 w-8 items-center justify-center border border-(--color-divider)"
          >
            <ChevronRight size={16} strokeWidth={1.5} />
          </Link>
        </div>
        {isAdmin && (
          <Link href="/crew" className="text-[13px] font-medium text-(--color-accent-700)">
            Crew · {crew.length}
          </Link>
        )}
      </div>
      <p className="-mt-2 text-[12px] font-medium uppercase tracking-[0.06em] text-(--color-accent-700)">
        {accepted} accepted · {pending} pending
      </p>

      {isAdmin && (
        <Card blueprint className="flex flex-col gap-3 p-3.5">
          <div className="flex items-center justify-between">
            <span className="font-(family-name:--font-heading) text-[11px] font-medium uppercase tracking-[0.1em] text-(--color-accent-700)">
              Coverage · whole crew
            </span>
            <Tag variant="accent">{profile.role === "lead" ? "Head intern · admin" : "Staff · admin"}</Tag>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {DAYS.map((day) => {
              const dayShifts = shifts.filter((s) => s.day_of_week === day);
              const hasOpen = dayShifts.some((s) => s.status === "open" || s.status === "pending");
              const word = dayShifts.length === 0 ? "no shifts" : hasOpen ? `${dayShifts.filter((s) => s.status === "open").length} open` : "set";
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(selectedDay === day ? null : (day as DayOfWeek))}
                  className={cn(
                    "flex flex-col items-center gap-0.5 border p-1.5 text-center",
                    hasOpen ? "border-(--color-accent-900)" : "border-transparent",
                    !hasOpen && dayShifts.length > 0 && "bg-(--color-accent-100)",
                  )}
                >
                  <span className="text-[9.5px] uppercase text-(--color-text)/70">{day}</span>
                  <span className="font-(family-name:--font-heading) text-[15px] font-semibold">
                    {dayShifts.length || "—"}
                  </span>
                  <span className="text-[8.5px] uppercase text-(--color-text-50)">{word}</span>
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-3 border-t border-(--color-divider) pt-2.5 text-center">
            {[
              ["awaiting reply", awaitingReply],
              ["unclaimed", unclaimed],
              ["not signed up", notSignedUp],
            ].map(([label, value]) => (
              <div key={label as string}>
                <div className="font-(family-name:--font-heading) text-[19px] font-semibold">{value}</div>
                <div className="text-[10px] uppercase text-(--color-text-50)">{label}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-7 gap-1">
        {DAYS.map((day, i) => {
          const active = selectedDay === day;
          const date = new Date(`${dayDates[i]}T00:00:00`);
          const worksThatDay = shifts.some((s) => s.day_of_week === day && s.assignee_id === profile.id);
          const someoneWorks = shifts.some((s) => s.day_of_week === day && s.assignee_id);
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(active ? null : (day as DayOfWeek))}
              className={cn(
                "flex flex-col items-center gap-1 border border-(--color-divider) py-2",
                active && "bg-(--color-accent-800) text-white",
              )}
            >
              <span className="text-[10px] uppercase opacity-70">{day}</span>
              <span className="font-(family-name:--font-heading) text-[16px] font-semibold">
                {date.getDate()}
              </span>
              <span
                className={cn(
                  "h-[5px] w-[5px]",
                  worksThatDay
                    ? "bg-(--color-accent)"
                    : someoneWorks
                      ? "bg-(--color-text)/30"
                      : "bg-transparent",
                )}
              />
            </button>
          );
        })}
      </div>

      <Seg
        options={[
          { value: "week", label: "Whole week" },
          { value: "mine", label: "My shifts" },
        ]}
        value={scope}
        onChange={setScope}
      />

      <div className="flex flex-col gap-3">
        {groups.map((group) => (
          <ShiftCard
            key={group[0].id}
            shifts={group}
            currentProfileId={profile.id}
            isAdmin={isAdmin}
            availability={availability}
            requireSwapOnDecline={requireSwapOnDecline}
            candidates={candidates}
            assignableCrew={assignableCrew}
          />
        ))}
        {groups.length === 0 && (
          <p className="py-6 text-center text-[13px] text-(--color-text-50)">No shifts here.</p>
        )}
      </div>

      {isAdmin && (
        <div className="flex gap-2 pt-1">
          <Link href={`/schedule/new?week=${weekStart}`} className={buttonClasses("primary", false, "flex-1")}>
            + New shift
          </Link>
          <Link
            href={`/schedule/new?week=${weekStart}&open=1`}
            className={buttonClasses("secondary", false, "flex-1")}
          >
            Quick open slot
          </Link>
        </div>
      )}

      {!isAdmin && (
        <div className="pt-1">
          <Link
            href={`/schedule/propose?week=${weekStart}`}
            className={buttonClasses("secondary", false, "w-full")}
          >
            + Propose extra time
          </Link>
        </div>
      )}
    </div>
  );
}
