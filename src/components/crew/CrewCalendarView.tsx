"use client";

import { useMemo, useState } from "react";
import { DAYS, addDays, formatShortDate, toMinutes } from "@/lib/domain/time";
import { Tag } from "@/components/ui/Tag";
import { cn } from "@/lib/utils";
import type { AvailabilityBlock } from "@/lib/domain/conflicts";
import type { DayOfWeek, Profile } from "@/lib/types";

interface CrewCalendarViewProps {
  weekStart: string;
  crew: Profile[];
  availability: AvailabilityBlock[];
  defaultDay: DayOfWeek;
}

export function CrewCalendarView({ weekStart, crew, availability, defaultDay }: CrewCalendarViewProps) {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(defaultDay);
  const dayDates = DAYS.map((_, i) => addDays(weekStart, i));
  const dayIndex = DAYS.indexOf(selectedDay);
  const date = dayDates[dayIndex];

  const nameFor = (profileId: string) => crew.find((c) => c.id === profileId)?.full_name ?? "Unknown";

  const blocksToday = useMemo(() => {
    return availability
      .filter((b) => (b.specific_date ? b.specific_date === date : b.day_of_week === selectedDay))
      .map((b) => ({ ...b, name: nameFor(b.profile_id) }))
      .sort((a, b) => {
        if (a.all_day !== b.all_day) return a.all_day ? -1 : 1;
        return (toMinutes(a.start_time ?? "") ?? 0) - (toMinutes(b.start_time ?? "") ?? 0);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availability, date, selectedDay]);

  const planned = blocksToday.filter((b) => b.kind === "planned");
  const busy = blocksToday.filter((b) => b.kind === "busy");

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <p className="text-[13px] text-(--color-text-62)">
        Who&apos;s planning to come in, and who&apos;s blocked out — pulled from everyone&apos;s own weekly
        schedule.
      </p>

      <div className="grid grid-cols-7 gap-1">
        {DAYS.map((day, i) => {
          const active = selectedDay === day;
          const d = new Date(`${dayDates[i]}T00:00:00`);
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day as DayOfWeek)}
              className={cn(
                "flex flex-col items-center gap-1 border border-(--color-divider) py-2",
                active && "bg-(--color-accent-800) text-white",
              )}
            >
              <span className="text-[10px] uppercase opacity-70">{day}</span>
              <span className="font-(family-name:--font-heading) text-[16px] font-semibold">{d.getDate()}</span>
            </button>
          );
        })}
      </div>

      <div>
        <div className="mb-1.5 flex items-center gap-2">
          <h5 className="font-(family-name:--font-heading) text-[13px] font-semibold uppercase tracking-[0.06em] text-(--color-accent-700)">
            Planning to come in
          </h5>
          <Tag variant="accent">{planned.length}</Tag>
        </div>
        <div className="flex flex-col">
          {planned.map((b) => (
            <div
              key={b.id}
              className="flex items-center gap-3 border-b border-(--color-divider) py-2.5 last:border-b-0"
            >
              <span className="flex-1 text-[14px] font-medium">{b.name}</span>
              <span className="text-[12.5px] text-(--color-text-62)">
                {b.label}
                {b.specific_date && ` · ${formatShortDate(b.specific_date)}`}
              </span>
              <span className="w-28 shrink-0 text-right text-[12px] text-(--color-text-50)">
                {b.all_day ? "All day" : `${b.start_time} – ${b.end_time}`}
              </span>
            </div>
          ))}
          {planned.length === 0 && (
            <div className="border border-(--color-divider) p-4 text-center text-[13px] text-(--color-text-50)">
              Nobody&apos;s said they&apos;re coming in on {selectedDay}.
            </div>
          )}
        </div>
      </div>

      <div>
        <h5 className="mb-1.5 font-(family-name:--font-heading) text-[13px] font-semibold uppercase tracking-[0.06em] text-(--color-text-55)">
          Busy / can&apos;t work
        </h5>
        <div className="flex flex-col">
          {busy.map((b) => (
            <div
              key={b.id}
              className="flex items-center gap-3 border-b border-(--color-divider) py-2.5 last:border-b-0"
            >
              <span className="flex-1 text-[14px] font-medium">{b.name}</span>
              <span className="text-[12.5px] text-(--color-text-62)">
                {b.label}
                {b.specific_date && ` · ${formatShortDate(b.specific_date)}`}
              </span>
              <span className="w-28 shrink-0 text-right text-[12px] text-(--color-text-50)">
                {b.all_day ? "All day" : `${b.start_time} – ${b.end_time}`}
              </span>
            </div>
          ))}
          {busy.length === 0 && (
            <div className="border border-(--color-divider) p-4 text-center text-[13px] text-(--color-text-50)">
              Nobody&apos;s blocked out on {selectedDay}.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
