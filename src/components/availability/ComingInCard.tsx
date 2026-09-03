"use client";

import { useMemo, useState, useTransition } from "react";
import { addComingInBlockAction, addOneTimeComingInBlockAction } from "@/lib/actions/availability";
import { DAYS, TIME_OPTIONS, formatShortDate, spanLabel, toMinutes } from "@/lib/domain/time";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Field";
import { Seg } from "@/components/ui/Seg";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import type { DayOfWeek } from "@/lib/types";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// The preview bar always spans the same 5 AM–10 PM window as the time
// pickers themselves, so any selection lands somewhere on it.
const PREVIEW_START_MIN = 5 * 60;
const PREVIEW_END_MIN = 22 * 60;
const PREVIEW_SPAN_MIN = PREVIEW_END_MIN - PREVIEW_START_MIN;

export function ComingInCard({ profileId }: { profileId: string }) {
  const [mode, setMode] = useState<"weekly" | "once">("weekly");
  const [days, setDays] = useState<DayOfWeek[]>([]);
  const [date, setDate] = useState(todayStr());
  const [start, setStart] = useState("4:00 PM");
  const [end, setEnd] = useState("6:00 PM");
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const { show } = useToast();

  const toggleDay = (day: DayOfWeek) =>
    setDays((d) => (d.includes(day) ? d.filter((x) => x !== day) : [...d, day]));

  const previewRange = useMemo(() => {
    const s = toMinutes(start);
    const e = toMinutes(end);
    return s != null && e != null && e > s ? { s, e } : null;
  }, [start, end]);

  const previewWhen =
    mode === "weekly"
      ? days.length > 0
        ? days.join(", ")
        : "Pick a day"
      : formatShortDate(date);

  const submit = () => {
    startTransition(async () => {
      const result =
        mode === "weekly"
          ? await addComingInBlockAction({ profileId, days, start, end, label: reason.trim() })
          : await addOneTimeComingInBlockAction({ profileId, date, start, end, label: reason.trim() });
      if (result.error) {
        show(result.error);
      } else {
        setReason("");
        show("Added — visible on the crew calendar, no approval needed.");
      }
    });
  };

  return (
    <Card blueprint className="flex flex-col gap-2.5 p-3.5">
      <span className="font-(family-name:--font-heading) text-[11px] font-medium uppercase tracking-[0.1em] text-(--color-accent-700)">
        Planning to come in
      </span>
      <p className="text-[13px] text-(--color-text-62)">
        Rough plans for outside a scheduled shift — just visible to the crew and staff, no approval needed. For
        an actual assigned shift, use &quot;Propose extra time&quot; on the Schedule tab instead.
      </p>

      <Seg
        options={[
          { value: "weekly", label: "Every week" },
          { value: "once", label: "Just this once" },
        ]}
        value={mode}
        onChange={setMode}
      />

      {mode === "weekly" ? (
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
      ) : (
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      )}

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

      <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="What you'll be doing — optional" />

      <div className="border border-(--color-divider) p-2.5">
        <p className="mb-1.5 text-[11.5px] font-medium text-(--color-text-62)">
          {previewWhen}
          {previewRange && ` · ${start}–${end} · ${spanLabel(start, end)}`}
        </p>
        <div className="relative h-6 border border-(--color-divider) bg-(--color-accent-100)/40">
          {previewRange && (
            <div
              className="absolute inset-y-0 bg-(--color-accent-600)"
              style={{
                left: `${((previewRange.s - PREVIEW_START_MIN) / PREVIEW_SPAN_MIN) * 100}%`,
                width: `${((previewRange.e - previewRange.s) / PREVIEW_SPAN_MIN) * 100}%`,
              }}
            />
          )}
        </div>
        <div className="mt-0.5 flex justify-between text-[9px] text-(--color-text-42)">
          <span>5 AM</span>
          <span>2 PM</span>
          <span>10 PM</span>
        </div>
      </div>

      <Button disabled={pending || (mode === "weekly" && days.length === 0)} onClick={submit}>
        Add
      </Button>
    </Card>
  );
}
