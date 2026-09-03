"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DAYS, addDays, formatShortDate, formatWeekLabel, minutesToLabel, toMinutes } from "@/lib/domain/time";
import { initialsFor } from "@/lib/domain/shift-view";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { AvailabilityBlock } from "@/lib/domain/conflicts";
import type { DayOfWeek, Profile } from "@/lib/types";

interface CrewCalendarViewProps {
  weekStart: string;
  crew: Profile[];
  availability: AvailabilityBlock[];
}

const HOUR_PX = 26;
const MIN_WINDOW_START = 6 * 60; // never show earlier than 6:00 AM
const MAX_WINDOW_END = 23 * 60; // never show later than 11:00 PM
const DEFAULT_WINDOW: [number, number] = [12 * 60, 20 * 60]; // noon–8 PM when nobody's planned anything yet
const GRIDLINES = `repeating-linear-gradient(to bottom, transparent, transparent calc(${HOUR_PX}px - 1px), var(--color-divider) calc(${HOUR_PX}px - 1px), var(--color-divider) ${HOUR_PX}px)`;

interface TimedBlock {
  id: string;
  name: string;
  label: string;
  startMin: number;
  endMin: number;
}

interface LanedBlock extends TimedBlock {
  lane: number;
  totalLanes: number;
}

/**
 * Packs overlapping blocks into side-by-side lanes, like a calendar day
 * view — but only within each cluster of blocks that actually overlap
 * (transitively). A block with no real overlap always keeps full width,
 * even if something else overlaps later that same day.
 */
function packLanes(blocks: TimedBlock[]): LanedBlock[] {
  const sorted = [...blocks].sort((a, b) => a.startMin - b.startMin);
  const result: LanedBlock[] = [];
  let cluster: TimedBlock[] = [];
  let clusterEnd = -Infinity;

  const flushCluster = () => {
    if (cluster.length === 0) return;
    const laneEnds: number[] = [];
    const withLane = cluster.map((b) => {
      let lane = laneEnds.findIndex((end) => end <= b.startMin);
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(b.endMin);
      } else {
        laneEnds[lane] = b.endMin;
      }
      return { ...b, lane };
    });
    const totalLanes = Math.max(1, laneEnds.length);
    result.push(...withLane.map((b) => ({ ...b, totalLanes })));
    cluster = [];
  };

  for (const b of sorted) {
    if (cluster.length > 0 && b.startMin >= clusterEnd) {
      flushCluster();
      clusterEnd = -Infinity;
    }
    cluster.push(b);
    clusterEnd = Math.max(clusterEnd, b.endMin);
  }
  flushCluster();

  return result;
}

/** Compact "5:30p" form for narrow side-by-side lanes, where "5:30 PM" would wrap. */
function compactTimeLabel(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60) % 24;
  const mm = totalMinutes % 60;
  const ap = h < 12 ? "a" : "p";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return mm === 0 ? `${hh}${ap}` : `${hh}:${String(mm).padStart(2, "0")}${ap}`;
}

export function CrewCalendarView({ weekStart, crew, availability }: CrewCalendarViewProps) {
  const prevWeek = addDays(weekStart, -7);
  const nextWeek = addDays(weekStart, 7);
  const dayDates = DAYS.map((_, i) => addDays(weekStart, i));
  const todayStr = new Date().toISOString().slice(0, 10);
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const nameFor = (profileId: string) => crew.find((c) => c.id === profileId)?.full_name ?? "Unknown";

  const planned = useMemo(() => availability.filter((b) => b.kind === "planned"), [availability]);
  const busy = useMemo(() => availability.filter((b) => b.kind === "busy"), [availability]);

  const dayPlans = useMemo(() => {
    return DAYS.map((day, i) => {
      const date = dayDates[i];
      const timed = planned
        .filter((b) => (b.specific_date ? b.specific_date === date : b.day_of_week === day))
        .filter((b) => b.start_time && b.end_time)
        .map((b) => ({
          id: b.id,
          name: nameFor(b.profile_id),
          label: b.label,
          startMin: toMinutes(b.start_time!) ?? 0,
          endMin: toMinutes(b.end_time!) ?? 0,
        }));
      return { day: day as DayOfWeek, date, blocks: packLanes(timed) };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planned, weekStart]);

  const [windowStart, windowEnd] = useMemo(() => {
    const allMinutes = dayPlans.flatMap((d) => d.blocks.flatMap((b) => [b.startMin, b.endMin]));
    if (allMinutes.length === 0) return DEFAULT_WINDOW;
    const min = Math.max(MIN_WINDOW_START, Math.floor((Math.min(...allMinutes) - 30) / 60) * 60);
    const max = Math.min(MAX_WINDOW_END, Math.ceil((Math.max(...allMinutes) + 30) / 60) * 60);
    return [min, Math.max(max, min + 120)] as [number, number];
  }, [dayPlans]);

  const hours: number[] = [];
  for (let m = windowStart; m < windowEnd; m += 60) hours.push(m);
  const gridHeight = ((windowEnd - windowStart) / 60) * HOUR_PX;

  const totalPlanned = planned.length;
  const plannedInterns = new Set(planned.map((b) => b.profile_id)).size;
  const busiestDay = dayPlans.reduce(
    (best, d) => (d.blocks.length > best.count ? { day: d.day, count: d.blocks.length } : best),
    { day: "—", count: 0 },
  );

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center gap-1.5">
        <Link
          href={`/crew/calendar?week=${prevWeek}`}
          aria-label="Previous week"
          className="flex h-8 w-8 items-center justify-center border border-(--color-divider)"
        >
          <ChevronLeft size={16} strokeWidth={1.5} />
        </Link>
        <h4 className="flex-1 text-center font-(family-name:--font-heading) text-[19px] font-semibold">
          {formatWeekLabel(weekStart)}
        </h4>
        <Link
          href={`/crew/calendar?week=${nextWeek}`}
          aria-label="Next week"
          className="flex h-8 w-8 items-center justify-center border border-(--color-divider)"
        >
          <ChevronRight size={16} strokeWidth={1.5} />
        </Link>
      </div>

      <div className="grid grid-cols-3 border-y border-(--color-divider) py-2.5 text-center">
        <div>
          <div className="font-(family-name:--font-heading) text-[19px] font-semibold">{totalPlanned}</div>
          <div className="text-[10px] uppercase text-(--color-text-50)">Planned blocks</div>
        </div>
        <div>
          <div className="font-(family-name:--font-heading) text-[19px] font-semibold">{plannedInterns}</div>
          <div className="text-[10px] uppercase text-(--color-text-50)">Interns</div>
        </div>
        <div>
          <div className="font-(family-name:--font-heading) text-[19px] font-semibold">
            {busiestDay.count > 0 ? busiestDay.day : "—"}
          </div>
          <div className="text-[10px] uppercase text-(--color-text-50)">Busiest day</div>
        </div>
      </div>

      <Card blueprint className="flex flex-col p-0">
        <div className="flex items-baseline justify-between p-2.5">
          <span className="font-(family-name:--font-heading) text-[11px] font-medium uppercase tracking-[0.09em] text-(--color-accent-700)">
            Planning to come in
          </span>
          <span className="text-[10.5px] text-(--color-text-50)">Scroll for more days →</span>
        </div>
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

            <div className="relative grid" style={{ gridTemplateColumns: "40px repeat(7, 92px)", height: gridHeight }}>
              <div className="border-r border-(--color-divider)" style={{ backgroundImage: GRIDLINES }}>
                {hours.map((m) => (
                  <div
                    key={m}
                    className="pr-1 text-right text-[8.5px] text-(--color-text-42)"
                    style={{ height: HOUR_PX }}
                  >
                    {minutesToLabel(m)}
                  </div>
                ))}
              </div>

              {dayPlans.map(({ day, date, blocks }) => {
                const isToday = date === todayStr;
                return (
                  <div
                    key={day}
                    className={cn("relative border-r border-(--color-divider) last:border-r-0")}
                    style={{
                      backgroundImage: GRIDLINES,
                      backgroundColor: isToday ? "color-mix(in srgb, var(--color-accent-600) 4%, transparent)" : undefined,
                    }}
                  >
                    {blocks.map((b) => {
                      const top = ((b.startMin - windowStart) / 60) * HOUR_PX;
                      const height = Math.max(20, ((b.endMin - b.startMin) / 60) * HOUR_PX);
                      const widthPct = 100 / b.totalLanes;
                      return (
                        <div
                          key={b.id}
                          className="absolute overflow-hidden border-l-[2.5px] border-(--color-accent-700) bg-(--color-accent-100) px-1 py-0.5"
                          style={{
                            top,
                            height,
                            left: `calc(${b.lane * widthPct}% + 2px)`,
                            width: `calc(${widthPct}% - 4px)`,
                          }}
                          title={`${b.name} · ${minutesToLabel(b.startMin)}–${minutesToLabel(b.endMin)}${b.label ? ` · ${b.label}` : ""}`}
                        >
                          <div className="flex items-center gap-1 font-(family-name:--font-heading) text-[9.5px] leading-tight font-semibold text-(--color-accent-900)">
                            <span className="flex h-3 w-3 shrink-0 items-center justify-center bg-(--color-accent-800) text-[6px] font-bold text-white">
                              {initialsFor(b.name)}
                            </span>
                            <span className="truncate">{b.name}</span>
                          </div>
                          <div className="text-[8px] leading-tight text-(--color-accent-700)">
                            {b.totalLanes > 1
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

              {totalPlanned === 0 && (
                <div className="pointer-events-none absolute inset-0 col-start-2 col-end-9 flex items-center justify-center">
                  <p className="text-[12px] text-(--color-text-50)">Nobody&apos;s added plans yet this week.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      <div>
        <h5 className="mb-1.5 font-(family-name:--font-heading) text-[13px] font-semibold uppercase tracking-[0.06em] text-(--color-text-55)">
          Busy / can&apos;t work
        </h5>
        <div className="flex flex-col gap-3">
          {DAYS.map((day, i) => {
            const date = dayDates[i];
            const dayBusy = busy
              .filter((b) => (b.specific_date ? b.specific_date === date : b.day_of_week === day))
              .map((b) => ({ ...b, name: nameFor(b.profile_id) }))
              .sort((a, b) => (toMinutes(a.start_time ?? "") ?? -1) - (toMinutes(b.start_time ?? "") ?? -1));
            if (dayBusy.length === 0) return null;
            return (
              <div key={day}>
                <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.06em] text-(--color-text-50)">
                  {day} · {formatShortDate(date)}
                </p>
                <div className="flex flex-col">
                  {dayBusy.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center gap-3 border-b border-(--color-divider) py-2 last:border-b-0"
                    >
                      <span className="flex-1 text-[13px] font-medium">{b.name}</span>
                      <span className="text-[12px] text-(--color-text-62)">{b.label}</span>
                      <span className="w-24 shrink-0 text-right text-[11px] text-(--color-text-50)">
                        {b.all_day ? "All day" : `${b.start_time} – ${b.end_time}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {busy.length === 0 && (
            <div className="border border-(--color-divider) p-4 text-center text-[13px] text-(--color-text-50)">
              Nobody&apos;s blocked out this week.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
