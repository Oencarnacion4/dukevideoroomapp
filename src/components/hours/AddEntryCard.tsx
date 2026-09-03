"use client";

import { useState, useTransition } from "react";
import { logManualHoursAction } from "@/lib/actions/hours";
import { fmtHours } from "@/lib/domain/hours";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function AddEntryCard() {
  const [date, setDate] = useState(todayStr());
  const [label, setLabel] = useState("");
  const [hours, setHours] = useState("");
  const [pending, startTransition] = useTransition();
  const { show } = useToast();

  const parsedHours = Number(hours);
  const canSubmit = date.length > 0 && label.trim().length > 0 && parsedHours > 0;

  const submit = () => {
    startTransition(async () => {
      const result = await logManualHoursAction({ date, sessionLabel: label.trim(), hours: parsedHours });
      if (result.error) {
        show(result.error);
      } else {
        show(`Logged ${fmtHours(parsedHours)} for ${label.trim()}.`);
        setLabel("");
        setHours("");
      }
    });
  };

  return (
    <Card blueprint className="flex flex-col gap-2.5 p-3.5">
      <span className="font-(family-name:--font-heading) text-[11px] font-medium uppercase tracking-[0.1em] text-(--color-accent-700)">
        Forgot to clock in?
      </span>
      <p className="text-[13px] text-(--color-text-62)">
        Log hours you already worked directly — for anything that wasn&apos;t a scheduled shift, or if you
        forgot to clock in or out entirely.
      </p>

      <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} max={todayStr()} />
      <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="What you worked on" />
      <Input
        type="number"
        step="0.25"
        min="0.25"
        value={hours}
        onChange={(e) => setHours(e.target.value)}
        placeholder="Hours — e.g. 1.5"
      />

      <Button disabled={pending || !canSubmit} onClick={submit}>
        Log hours
      </Button>
    </Card>
  );
}
