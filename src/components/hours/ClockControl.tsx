"use client";

import { useEffect, useState, useTransition } from "react";
import { cancelClockAction, editClockInAction, toggleClockAction } from "@/lib/actions/hours";
import { liveDurationLabel } from "@/lib/domain/hours";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";

const MINUTES_AGO_PRESETS = [5, 10, 15, 30, 45, 60];

interface ClockControlProps {
  clockInAt: string | null;
  clockLabel: string | null;
  defaultLabel: string;
  variant: "strip" | "timesheet";
}

export function ClockControl({ clockInAt, clockLabel, defaultLabel, variant }: ClockControlProps) {
  const [now, setNow] = useState(() => Date.now());
  const [pending, startTransition] = useTransition();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [customMinutes, setCustomMinutes] = useState("");
  const { show } = useToast();

  useEffect(() => {
    if (!clockInAt) return;
    const id = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(id);
  }, [clockInAt]);

  const liveHours = clockInAt ? (now - new Date(clockInAt).getTime()) / 3_600_000 : 0;
  const label = clockLabel ?? defaultLabel;

  const onToggle = () => {
    const wasClockedIn = !!clockInAt;
    startTransition(async () => {
      const result = await toggleClockAction(defaultLabel);
      if (!wasClockedIn) {
        show("Clocked in. Timer runs until you clock out.");
      } else if (result.loggedHours) {
        show(`Clocked out — ${liveDurationLabel(result.loggedHours)} added to this week.`);
      } else {
        show("Clocked out — under a minute, nothing logged.");
      }
    });
  };

  const onCancel = () =>
    startTransition(async () => {
      await cancelClockAction();
      setCancelOpen(false);
      show("Clock-in canceled — nothing was logged.");
    });

  const setStartTime = (minutesAgo: number) =>
    startTransition(async () => {
      const result = await editClockInAction(minutesAgo);
      if (result.error) {
        show(result.error);
      } else {
        setEditOpen(false);
        setCustomMinutes("");
        show(`Start time moved back ${minutesAgo} min.`);
      }
    });

  const statusLine = clockInAt ? `On the clock · ${liveDurationLabel(liveHours)} · ${label}` : "Not clocked in";

  const cancelDialog = (
    <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)} title="Cancel this clock-in?">
      <p className="mb-4 text-[13px] text-(--color-text-62)">
        You&apos;ve been on the clock for {liveDurationLabel(liveHours)} — if that&apos;s wrong (forgot to clock
        out earlier, clocked in by mistake), this resets it without logging any hours. You can log the correct
        time manually afterward if needed.
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={() => setCancelOpen(false)}>
          Never mind
        </Button>
        <Button className="flex-1" disabled={pending} onClick={onCancel}>
          Cancel clock-in
        </Button>
      </div>
    </Dialog>
  );

  const editDialog = (
    <Dialog open={editOpen} onClose={() => setEditOpen(false)} title="When did you actually start?">
      <p className="mb-3 text-[13px] text-(--color-text-62)">
        Move your clock-in back to when you really got here — up to 4 hours. This changes the timer, not a
        logged entry, so the right hours land once you clock out.
      </p>
      <div className="mb-3 grid grid-cols-3 gap-2">
        {MINUTES_AGO_PRESETS.map((m) => (
          <Button key={m} variant="secondary" disabled={pending} onClick={() => setStartTime(m)}>
            {m} min ago
          </Button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={1}
          max={240}
          value={customMinutes}
          onChange={(e) => setCustomMinutes(e.target.value)}
          placeholder="Custom minutes ago"
          className="flex-1"
        />
        <Button
          disabled={pending || !customMinutes}
          onClick={() => setStartTime(Number(customMinutes))}
        >
          Set
        </Button>
      </div>
    </Dialog>
  );

  if (variant === "strip") {
    return (
      <div className="flex flex-col gap-1">
        <Button variant="secondary" fullWidth onClick={onToggle} disabled={pending} className="h-11">
          {clockInAt ? `Clock out · ${statusLine}` : `Clock in · ${statusLine}`}
        </Button>
        {clockInAt && (
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="text-[11px] text-(--color-text-50)"
            >
              Edit start time
            </button>
            <button
              type="button"
              onClick={() => setCancelOpen(true)}
              className="text-[11px] text-(--color-text-50)"
            >
              Not right? Cancel clock-in
            </button>
          </div>
        )}
        {cancelDialog}
        {editDialog}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Button onClick={onToggle} disabled={pending} className="h-[42px] w-full">
        {clockInAt ? "Clock out" : "Clock in"}
      </Button>
      <p className="text-center text-[11.5px] text-(--color-text-62)">{statusLine}</p>
      {clockInAt && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="text-[11px] text-(--color-text-50)"
          >
            Edit start time
          </button>
          <button
            type="button"
            onClick={() => setCancelOpen(true)}
            className="text-[11px] text-(--color-text-50)"
          >
            Not right? Cancel clock-in
          </button>
        </div>
      )}
      {cancelDialog}
      {editDialog}
    </div>
  );
}
