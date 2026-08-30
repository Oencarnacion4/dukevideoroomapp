"use client";

import { useState, useTransition } from "react";
import { addOneTimeBlockAction } from "@/lib/actions/availability";
import { TIME_OPTIONS } from "@/lib/domain/time";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Field";
import { Seg } from "@/components/ui/Seg";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function DayOffCard({ profileId }: { profileId: string }) {
  const [date, setDate] = useState(todayStr());
  const [mode, setMode] = useState<"time" | "all_day">("time");
  const [start, setStart] = useState("4:00 PM");
  const [end, setEnd] = useState("6:00 PM");
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const { show } = useToast();

  const submit = () => {
    startTransition(async () => {
      const result = await addOneTimeBlockAction({
        profileId,
        date,
        allDay: mode === "all_day",
        start,
        end,
        label: reason.trim() || "Day off",
      });
      if (result.error) {
        show(result.error);
      } else {
        setReason("");
        show(mode === "all_day" ? `Blocked ${date} — coaches see the conflict before assigning you.` : `Blocked ${start}–${end} on ${date}.`);
      }
    });
  };

  return (
    <Card blueprint className="flex flex-col gap-2.5 p-3.5">
      <span className="font-(family-name:--font-heading) text-[11px] font-medium uppercase tracking-[0.1em] text-(--color-accent-700)">
        Something came up
      </span>
      <p className="text-[13px] text-(--color-text-62)">
        A one-time thing on a specific date — this won&apos;t repeat next week, unlike a class.
      </p>

      <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />

      <Seg
        options={[
          { value: "time", label: "Specific time" },
          { value: "all_day", label: "All day" },
        ]}
        value={mode}
        onChange={setMode}
      />

      {mode === "time" && (
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
      )}

      <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason — e.g. club meeting, exam, travel home" />
      <Button disabled={pending} onClick={submit}>
        Block
      </Button>
    </Card>
  );
}
