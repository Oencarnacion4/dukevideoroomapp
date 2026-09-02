"use client";

import { useState, useTransition } from "react";
import { OverlayHeader } from "@/components/chrome/OverlayHeader";
import { Textarea, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { DAYS, TIME_OPTIONS, addDays, spanLabel } from "@/lib/domain/time";
import { locationFor } from "@/lib/constants";
import { proposeShiftAction } from "@/lib/actions/shifts";
import type { DayOfWeek } from "@/lib/types";

const OPEN_END = "Open end";
const LOCATION = locationFor("Extra time");

interface ProposeShiftFormProps {
  weekStart: string;
}

export function ProposeShiftForm({ weekStart }: ProposeShiftFormProps) {
  const [day, setDay] = useState<DayOfWeek>("Mon");
  const [start, setStart] = useState("4:15 PM");
  const [end, setEnd] = useState(OPEN_END);
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  const dayIndex = DAYS.indexOf(day);
  const date = addDays(weekStart, dayIndex);
  const durationLabel = spanLabel(start, end === OPEN_END ? null : end);
  const canSubmit = note.trim().length > 0;

  const submit = () => {
    startTransition(() =>
      proposeShiftAction({
        day,
        date,
        weekStart,
        startLabel: start,
        endLabel: end === OPEN_END ? null : end,
        location: LOCATION,
        note: note.trim(),
      }),
    );
  };

  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-(--color-bg)">
      <OverlayHeader eyebrow="Propose extra time" title="Coming in outside a shift" variant="close" />
      <div className="flex flex-1 flex-col gap-4 p-4 pb-40">
        <p className="text-[12.5px] text-(--color-text-62)">
          Not a scheduled shift — pick when you plan to come in and why. It shows up on the schedule as{" "}
          <span className="font-medium">Awaiting approval</span> until the head intern or staff sign off.
        </p>

        <div>
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-(--color-text-55)">Day</p>
          <div className="grid grid-cols-7 gap-1">
            {DAYS.map((d) => (
              <button
                key={d}
                onClick={() => setDay(d as DayOfWeek)}
                className={cn(
                  "border border-(--color-divider) py-2 text-[11px] uppercase",
                  day === d && "bg-(--color-accent-800) text-white",
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-(--color-text-55)">Start and end</p>
          <div className="flex items-center gap-2">
            <Select value={start} onChange={(e) => setStart(e.target.value)} className="flex-1">
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
            <span className="text-[13px] text-(--color-text-50)">to</span>
            <Select value={end} onChange={(e) => setEnd(e.target.value)} className="flex-1">
              <option value={OPEN_END}>Open end</option>
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>
          <p className="mt-1.5 text-[12px] text-(--color-text-62)">
            {end === OPEN_END
              ? "No end time — hours still come from the clock."
              : `Planned ${durationLabel} — hours still come from the clock.`}
          </p>
        </div>

        <div>
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-(--color-text-55)">
            Why you&apos;re coming in
          </p>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Catching up on editing, prepping a resource, fixing a camera issue…"
          />
        </div>
      </div>

      <div className="fixed right-0 bottom-0 left-0 mx-auto flex max-w-[480px] flex-col gap-2 border-t border-(--color-divider) bg-(--color-bg) p-4">
        <p className="text-[12.5px] text-(--color-text-62)">
          {day} · {start} · {durationLabel === "Open end" ? "open end" : durationLabel} — {LOCATION}
        </p>
        <Button fullWidth disabled={!canSubmit || pending} onClick={submit}>
          {canSubmit ? "Send for approval" : "Say why you're coming in"}
        </Button>
      </div>
    </div>
  );
}
