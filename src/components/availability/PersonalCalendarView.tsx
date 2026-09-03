"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DAYS, addDays, formatWeekLabel, minutesToLabel, toMinutes } from "@/lib/domain/time";
import { packLanes, compactTimeLabel, gridlinesBackground, computeWindow } from "@/lib/domain/calendar-grid";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { AvailabilityBlock } from "@/lib/domain/conflicts";
import type { DayOfWeek } from "@/lib/types";

interface PersonalCalendarViewProps {
  weekStart: string;
  blocks: AvailabilityBlock[];
  basePath: string;
}

const HOUR_PX = 26;
const MIN_WINDOW_START = 6 * 60;
const MAX_WINDOW_END = 23 * 60;
const DEFAULT_WINDOW: [number, number] = [8 * 60, 18 * 60];
const GRIDLINES = gridlinesBackground(HOUR_PX);

export function PersonalCalendarView({ weekStart, blocks, basePath }: PersonalCalendarViewProps) {
  const prevWeek = addDays(weekStart, -7);
  const nextWeek = addDays(weekStart, 7);
  const dayDates = DAYS.map((_, i) => addDays(weekStart, i));
  const todayStr = new Date().toISOString().slice(0, 10);
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const dayPlans = useMemo(() => {
    return DAYS.map((day, i) => {
      const date = dayDates[i];
      const blocksForDay = blocks.filter((b) =>
        b.specific_date ? b.specific_date === date : b.day_of_week === day,
      );
      const timed = blocksForDay
        .filter((b) => b.start_time && b.end_time)
        .map((b) => ({
          id: b.id,
          label: b.label,
          startMin: toMinutes(b.start_time!) ?? 0,
          endMin: toMinutes(b.end_time!) ?? 0,
          kind: b.kind,
        }));
      const allDay = blocksForDay.filter((b) => b.all_day).map((b) => ({ id: b.id, label: b.label }));
      return { day: day as DayOfWeek, date, blocks: packLanes(timed), allDay };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks, weekStart]);

  const [windowStart, windowEnd] = useMemo(() => {
    const allMinutes = dayPlans.flatMap((d) => d.blocks.flatMap((b) => [b.block.startMin, b.block.endMin]));
    return computeWindow(allMinutes, { min: MIN_WINDOW_START, max: MAX_WINDOW_END, fallback: DEFAULT_WINDOW });
  }, [dayPlans]);

  const hours: number[] = [];
  for (let m = windowStart; m < windowEnd; m += 60) hours.push(m);
  const gridHeight = ((windowEnd - windowStart) / 60) * HOUR_PX;

  const hasAnyBlocks = dayPlans.some((d) => d.blocks.length > 0 || d.allDay.length > 0);

  return (
    <Card blueprint className="flex flex-col p-0">
      <div className="flex items-center justify-between p-2.5">
        <div className="flex items-center gap-1">
          <Link
            href={`${basePath}?week=${prevWeek}`}
            aria-label="Previous week"
            className="flex h-6 w-6 items-center justify-center border border-(--color-divider)"
          >
            <ChevronLeft size={13} strokeWidth={1.5} />
          </Link>
          <span className="font-(family-name:--font-heading) text-[11px] font-medium uppercase tracking-[0.09em] text-(--color-accent-700)">
            {formatWeekLabel(weekStart)}
          </span>
          <Link
            href={`${basePath}?week=${nextWeek}`}
            aria-label="Next week"
            className="flex h-6 w-6 items-center justify-center border border-(--color-divider)"
          >
            <ChevronRight size={13} strokeWidth={1.5} />
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[10px] text-(--color-text-55)">
            <span className="h-2 w-2 bg-(--color-danger-700)" /> Classes
          </span>
          <span className="flex items-center gap-1 text-[10px] text-(--color-text-55)">
            <span className="h-2 w-2 bg-(--color-accent-700)" /> Coming in
          </span>
        </div>
      </div>
      <p className="px-2.5 pb-1.5 text-[10.5px] text-(--color-text-50)">Scroll for more days →</p>
      <div className="overflow-x-auto border-t border-(--color-divider)">
        <div className="w-max min-w-full">
          <div className="grid" style={{ gridTemplateColumns: "40px repeat(7, 92px)" }}>
            <div className="border-r border-b border-(--color-divider)" />
            {DAYS.map((day, i) => {
              const isToday = dayDates[i] === todayStr;
              return (
                <div
                  key={day}
                  className={cn(
                    "border-r border-b border-(--color-divider) py-1.5 text-center last:border-r-0",
                    isToday && "bg-(--color-accent-800)",
                  )}
                >
                  <div
                    className={cn(
                      "text-[10px] font-medium uppercase",
                      isToday ? "text-(--color-accent-300)" : "text-(--color-text-55)",
                    )}
                  >
                    {day}
                  </div>
                  <div
                    className={cn(
                      "font-(family-name:--font-heading) text-[14px] font-semibold",
                      isToday && "text-white",
                    )}
                  >
                    {new Date(`${dayDates[i]}T00:00:00`).getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          {dayPlans.some((d) => d.allDay.length > 0) && (
            <div className="grid border-b border-(--color-divider)" style={{ gridTemplateColumns: "40px repeat(7, 92px)" }}>
              <div className="border-r border-(--color-divider)" />
              {dayPlans.map(({ day, allDay }) => (
                <div key={day} className="flex flex-col gap-0.5 border-r border-(--color-divider) p-1 last:border-r-0">
                  {allDay.map((b) => (
                    <span
                      key={b.id}
                      className="truncate border-l-[2.5px] border-(--color-danger-700) bg-(--color-danger-100) px-1 py-0.5 text-[8px] font-medium text-(--color-danger-700)"
                    >
                      {b.label || "All day"}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          )}

          <div className="relative grid" style={{ gridTemplateColumns: "40px repeat(7, 92px)", height: gridHeight }}>
            <div className="border-r border-(--color-divider)" style={{ backgroundImage: GRIDLINES }}>
              {hours.map((m) => (
                <div key={m} className="pr-1 text-right text-[8.5px] text-(--color-text-42)" style={{ height: HOUR_PX }}>
                  {minutesToLabel(m)}
                </div>
              ))}
            </div>

            {dayPlans.map(({ day, date, blocks }) => {
              const isToday = date === todayStr;
              return (
                <div
                  key={day}
                  className="relative border-r border-(--color-divider) last:border-r-0"
                  style={{
                    backgroundImage: GRIDLINES,
                    backgroundColor: isToday ? "color-mix(in srgb, var(--color-accent-600) 4%, transparent)" : undefined,
                  }}
                >
                  {blocks.map(({ block: b, lane, totalLanes }) => {
                    const top = ((b.startMin - windowStart) / 60) * HOUR_PX;
                    const height = Math.max(20, ((b.endMin - b.startMin) / 60) * HOUR_PX);
                    const widthPct = 100 / totalLanes;
                    const isBusy = b.kind === "busy";
                    return (
                      <div
                        key={b.id}
                        className={cn(
                          "absolute overflow-hidden border-l-[2.5px] px-1 py-0.5",
                          isBusy
                            ? "border-(--color-danger-700) bg-(--color-danger-100)"
                            : "border-(--color-accent-700) bg-(--color-accent-100)",
                        )}
                        style={{
                          top,
                          height,
                          left: `calc(${lane * widthPct}% + 2px)`,
                          width: `calc(${widthPct}% - 4px)`,
                        }}
                        title={`${b.label || (isBusy ? "Class" : "Coming in")} · ${minutesToLabel(b.startMin)}–${minutesToLabel(b.endMin)}`}
                      >
                        <div
                          className={cn(
                            "truncate font-(family-name:--font-heading) text-[9.5px] leading-tight font-semibold",
                            isBusy ? "text-(--color-danger-700)" : "text-(--color-accent-900)",
                          )}
                        >
                          {b.label || (isBusy ? "Class" : "Coming in")}
                        </div>
                        <div
                          className={cn(
                            "text-[8px] leading-tight",
                            isBusy ? "text-(--color-danger-700)" : "text-(--color-accent-700)",
                          )}
                        >
                          {totalLanes > 1
                            ? `${compactTimeLabel(b.startMin)}–${compactTimeLabel(b.endMin)}`
                            : `${minutesToLabel(b.startMin)}–${minutesToLabel(b.endMin)}`}
                        </div>
                      </div>
                    );
                  })}

                  {isToday && nowMinutes >= windowStart && nowMinutes <= windowEnd && (
                    <div
                      className="absolute right-0 left-0 border-t border-(--color-accent-600)"
                      style={{ top: ((nowMinutes - windowStart) / 60) * HOUR_PX }}
                    >
                      <span className="absolute -top-[7px] right-0.5 bg-(--color-accent-600) px-1 font-(family-name:--font-heading) text-[7px] font-semibold text-white">
                        NOW
                      </span>
                    </div>
                  )}
                </div>
              );
            })}

            {!hasAnyBlocks && (
              <div className="pointer-events-none absolute inset-0 col-start-2 col-end-9 flex items-center justify-center">
                <p className="text-[12px] text-(--color-text-50)">Nothing on the calendar this week.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
