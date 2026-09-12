"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DAYS, addDays, formatWeekLabel, minutesToLabel, toMinutes } from "@/lib/domain/time";
import { computeWindow } from "@/lib/domain/calendar-grid";
import { shiftWindow } from "@/lib/domain/conflicts";
import { computeFreeGrid, type BusyShift } from "@/lib/domain/free-time";
import { initialsFor } from "@/lib/domain/shift-view";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { cn } from "@/lib/utils";
import type { AvailabilityBlock } from "@/lib/domain/conflicts";
import type { DayOfWeek, Profile } from "@/lib/types";

interface WhenFreeGridProps {
  weekStart: string;
  crew: Profile[];
  busyBlocks: AvailabilityBlock[];
  shifts: BusyShift[];
}

const SLOT_MIN = 30;
const ROW_PX = 15;
const MIN_WINDOW_START = 7 * 60;
const MAX_WINDOW_END = 22 * 60;
const DEFAULT_WINDOW: [number, number] = [9 * 60, 18 * 60];

function heatStyle(freeCount: number, total: number): string {
  if (total === 0 || freeCount === 0) return "bg-transparent";
  const ratio = freeCount / total;
  if (ratio === 1) return "bg-(--color-accent-800)";
  if (ratio >= 0.75) return "bg-(--color-accent-600)";
  if (ratio >= 0.5) return "bg-(--color-accent-400)";
  if (ratio >= 0.25) return "bg-(--color-accent-200)";
  return "bg-(--color-accent-100)";
}

export function WhenFreeGrid({ weekStart, crew, busyBlocks, shifts }: WhenFreeGridProps) {
  const prevWeek = addDays(weekStart, -7);
  const nextWeek = addDays(weekStart, 7);
  const dayDates = DAYS.map((_, i) => addDays(weekStart, i));
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selected, setSelected] = useState<{ day: DayOfWeek; date: string; startMin: number } | null>(null);

  const nameById = useMemo(() => new Map(crew.map((c) => [c.id, c.full_name])), [crew]);

  const [windowStart, windowEnd] = useMemo(() => {
    const minutes: number[] = [];
    for (const b of busyBlocks) {
      if (b.all_day || !b.start_time || !b.end_time) continue;
      const s = toMinutes(b.start_time);
      const e = toMinutes(b.end_time);
      if (s != null) minutes.push(s);
      if (e != null) minutes.push(e);
    }
    for (const s of shifts) {
      if (s.status !== "accepted") continue;
      const [start, end] = shiftWindow(s.start_time, s.end_time);
      minutes.push(start, end);
    }
    return computeWindow(minutes, { min: MIN_WINDOW_START, max: MAX_WINDOW_END, fallback: DEFAULT_WINDOW });
  }, [busyBlocks, shifts]);

  const grid = useMemo(
    () => computeFreeGrid(crew, busyBlocks, shifts, DAYS, dayDates, windowStart, windowEnd, SLOT_MIN),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [crew, busyBlocks, shifts, windowStart, windowEnd, weekStart],
  );

  const rowStarts: number[] = [];
  for (let m = windowStart; m < windowEnd; m += SLOT_MIN) rowStarts.push(m);

  const selectedSlot =
    selected &&
    grid.find((d) => d.day === selected.day)?.slots.find((s) => s.startMin === selected.startMin);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center gap-1.5">
        <Link
          href={`/crew/calendar?tab=free&week=${prevWeek}`}
          aria-label="Previous week"
          className="flex h-8 w-8 items-center justify-center border border-(--color-divider)"
        >
          <ChevronLeft size={16} strokeWidth={1.5} />
        </Link>
        <h4 className="flex-1 text-center font-(family-name:--font-heading) text-[19px] font-semibold">
          {formatWeekLabel(weekStart)}
        </h4>
        <Link
          href={`/crew/calendar?tab=free&week=${nextWeek}`}
          aria-label="Next week"
          className="flex h-8 w-8 items-center justify-center border border-(--color-divider)"
        >
          <ChevronRight size={16} strokeWidth={1.5} />
        </Link>
      </div>

      <p className="text-[12.5px] text-(--color-text-62)">
        Darker = more of the crew is free. Tap a slot to see exactly who. Based on everyone&apos;s class times,
        blocked-off time, and accepted shifts — {crew.length} on the crew right now.
      </p>

      <div className="flex items-center gap-1.5 text-[10.5px] text-(--color-text-50)">
        <span>Fewer free</span>
        {["bg-(--color-accent-100)", "bg-(--color-accent-200)", "bg-(--color-accent-400)", "bg-(--color-accent-600)", "bg-(--color-accent-800)"].map(
          (c) => (
            <span key={c} className={cn("h-3 w-4 border border-(--color-divider)", c)} />
          ),
        )}
        <span>Everyone free</span>
      </div>

      <Card blueprint className="flex flex-col p-0">
        <div className="flex items-baseline justify-end p-2">
          <span className="text-[10.5px] text-(--color-text-50)">Scroll for more days →</span>
        </div>
        <div className="overflow-x-auto border-t border-(--color-divider)">
          <div className="w-max min-w-full">
            <div className="grid" style={{ gridTemplateColumns: "44px repeat(7, 92px)" }}>
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
                        "font-(family-name:--font-heading) text-[13px] font-semibold",
                        isToday && "text-white",
                      )}
                    >
                      {new Date(`${dayDates[i]}T00:00:00`).getDate()}
                    </div>
                  </div>
                );
              })}
            </div>

            {rowStarts.map((startMin, rowIdx) => (
              <div key={startMin} className="grid" style={{ gridTemplateColumns: "44px repeat(7, 92px)" }}>
                <div
                  className="flex items-start justify-end border-r border-(--color-divider) pr-1 text-[8px] text-(--color-text-42)"
                  style={{ height: ROW_PX }}
                >
                  {startMin % 60 === 0 ? minutesToLabel(startMin) : ""}
                </div>
                {grid.map(({ day, date, slots }) => {
                  const slot = slots[rowIdx];
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setSelected({ day, date, startMin })}
                      className={cn(
                        "border-r border-b border-(--color-divider) last:border-r-0",
                        heatStyle(slot.freeIds.length, crew.length),
                      )}
                      style={{ height: ROW_PX }}
                      aria-label={`${day} ${minutesToLabel(startMin)} — ${slot.freeIds.length} of ${crew.length} free`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Dialog
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.day} ${minutesToLabel(selected.startMin)}` : ""}
      >
        {selectedSlot && (
          <div className="flex flex-col gap-3">
            <div>
              <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.06em] text-(--color-accent-700)">
                Free ({selectedSlot.freeIds.length})
              </p>
              {selectedSlot.freeIds.length === 0 ? (
                <p className="text-[13px] text-(--color-text-50)">Nobody&apos;s free then.</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {selectedSlot.freeIds.map((id) => (
                    <div key={id} className="flex items-center gap-2 text-[13.5px]">
                      <span className="flex h-5 w-5 items-center justify-center bg-(--color-accent-100) font-(family-name:--font-heading) text-[9px] text-(--color-accent-800)">
                        {initialsFor(nameById.get(id) ?? "?")}
                      </span>
                      {nameById.get(id) ?? "Unknown"}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedSlot.busy.length > 0 && (
              <div>
                <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.06em] text-(--color-danger-700)">
                  Busy ({selectedSlot.busy.length})
                </p>
                <div className="flex flex-col gap-1">
                  {selectedSlot.busy.map((b) => (
                    <div key={b.id} className="flex items-center justify-between gap-2 text-[13.5px]">
                      <span>{nameById.get(b.id) ?? "Unknown"}</span>
                      <span className="text-[11.5px] text-(--color-text-50)">{b.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
}
