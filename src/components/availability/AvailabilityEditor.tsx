"use client";

import { useState, useTransition } from "react";
import { addClassBlockAction, removeClassBlockAction } from "@/lib/actions/availability";
import { TIME_OPTIONS, pgTimeToLabel } from "@/lib/domain/time";
import { DAYS } from "@/lib/domain/time";
import { Select, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import type { Availability, DayOfWeek } from "@/lib/types";

interface AvailabilityEditorProps {
  profileId: string;
  blocks: Availability[];
  canEdit: boolean;
}

export function AvailabilityEditor({ profileId, blocks, canEdit }: AvailabilityEditorProps) {
  const [days, setDays] = useState<DayOfWeek[]>(["Mon"]);
  const [start, setStart] = useState("9:00 AM");
  const [end, setEnd] = useState("10:15 AM");
  const [label, setLabel] = useState("");
  const [pending, startTransition] = useTransition();
  const { show } = useToast();

  const toggleDay = (day: DayOfWeek) =>
    setDays((d) => (d.includes(day) ? d.filter((x) => x !== day) : [...d, day]));

  const sorted = [...blocks].sort(
    (a, b) => DAYS.indexOf(a.day_of_week) - DAYS.indexOf(b.day_of_week) || (a.start_time ?? "").localeCompare(b.start_time ?? ""),
  );

  const submit = () => {
    if (!label.trim()) return;
    startTransition(async () => {
      const result = await addClassBlockAction({ profileId, days, start, end, label: label.trim() });
      if (result.error) {
        show(result.error);
      } else {
        setLabel("");
        show("Block added.");
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col">
        {sorted.map((b) => (
          <div key={b.id} className="flex items-center gap-3 border-b border-(--color-divider) py-2.5 last:border-b-0">
            <span className="w-10 shrink-0 font-(family-name:--font-heading) text-[12px] font-medium uppercase text-(--color-accent-700)">
              {b.day_of_week}
            </span>
            <div className="flex-1">
              <p className="text-[14px]">{b.label}</p>
              <p className="text-[11.5px] text-(--color-text-50)">
                {b.all_day ? "All day — cannot work" : `${pgTimeToLabel(b.start_time!)} – ${pgTimeToLabel(b.end_time!)}`}
              </p>
            </div>
            {canEdit && (
              <button
                onClick={() => startTransition(() => removeClassBlockAction(b.id, profileId))}
                className="text-[12px] font-medium text-(--color-accent-700)"
              >
                Remove
              </button>
            )}
          </div>
        ))}
        {sorted.length === 0 && (
          <div className="border border-(--color-divider) p-4 text-center text-[13px] text-(--color-text-50)">
            Nothing blocked yet — every hour of the week is open.
          </div>
        )}
      </div>

      {canEdit && (
        <div className="flex flex-col gap-3 border-t border-(--color-divider) pt-4">
          <div>
            <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-(--color-text-55)">Days</p>
            <div className="grid grid-cols-7 gap-1">
              {DAYS.map((day) => (
                <button
                  key={day}
                  onClick={() => toggleDay(day as DayOfWeek)}
                  className={cn(
                    "border border-(--color-divider) py-2 text-[11px] uppercase",
                    days.includes(day as DayOfWeek) && "bg-(--color-accent-800) text-white",
                  )}
                >
                  {day}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[12px] text-(--color-text-62)">
              {days.length > 1
                ? `Blocking ${days.join(", ")} — one entry per day, same time.`
                : "Pick the days this class meets (tap several — MWF in one go)."}
            </p>
          </div>

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
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>

          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Course or reason" />
          <Button disabled={pending} onClick={submit}>
            Block
          </Button>
        </div>
      )}
    </div>
  );
}
