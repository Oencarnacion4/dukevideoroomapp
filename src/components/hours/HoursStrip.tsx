"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/hours/ProgressBar";
import { ClockControl } from "@/components/hours/ClockControl";
import { fmtHours, hoursVerdict, WEEKLY_CAP_HOURS } from "@/lib/domain/hours";

interface HoursStripProps {
  baseHours: number;
  clockInAt: string | null;
  clockLabel: string | null;
  defaultLabel: string;
}

export function HoursStrip({ baseHours, clockInAt, clockLabel, defaultLabel }: HoursStripProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!clockInAt) return;
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, [clockInAt]);

  const liveHours = clockInAt ? (now - new Date(clockInAt).getTime()) / 3_600_000 : 0;
  const total = baseHours + liveHours;

  return (
    <Card className="flex flex-col gap-2.5 p-3.5">
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] text-(--color-text)">Hours this week</span>
        <span className="font-(family-name:--font-heading) text-[19px] font-semibold">
          {fmtHours(total)}{" "}
          <span className="font-(family-name:--font-body) text-[11px] font-normal text-(--color-text-50)">
            of 10–15
          </span>
        </span>
      </div>
      <ProgressBar hours={total} />
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-(--color-text-62)">
          {total < WEEKLY_CAP_HOURS
            ? `Room for ${fmtHours(WEEKLY_CAP_HOURS - total)} more`
            : hoursVerdict(total)}
        </p>
        <Link href="/hours" className="text-[12px] font-medium text-(--color-accent-700)">
          Timesheet
        </Link>
      </div>
      <ClockControl
        clockInAt={clockInAt}
        clockLabel={clockLabel}
        defaultLabel={defaultLabel}
        variant="strip"
      />
    </Card>
  );
}
