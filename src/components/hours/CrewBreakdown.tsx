"use client";

import { useState } from "react";
import { fmtHours } from "@/lib/domain/hours";
import { ProgressBar } from "@/components/hours/ProgressBar";
import { Tag } from "@/components/ui/Tag";
import type { Profile, TimeEntry } from "@/lib/types";

interface CrewBreakdownProps {
  crew: Profile[];
  entries: TimeEntry[];
  minHours: number;
  capHours: number;
}

export function CrewBreakdown({ crew, entries, minHours, capHours }: CrewBreakdownProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      {crew.map((c) => {
        const mine = entries.filter((e) => e.profile_id === c.id);
        const total = mine.filter((e) => e.status === "approved").reduce((sum, e) => sum + Number(e.hours), 0);
        const status =
          total >= capHours ? "at cap" : total >= minHours ? "in range" : `${fmtHours(minHours - total)} short`;
        const isOpen = openId === c.id;

        return (
          <div key={c.id} className="border-b border-(--color-divider) pb-2 last:border-b-0">
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : c.id)}
              className="flex w-full items-center gap-2 py-1 text-left"
            >
              <span className="flex-1 text-[13.5px]">{c.full_name}</span>
              <span className="font-(family-name:--font-heading) text-[15px] font-semibold">{fmtHours(total)}</span>
              <span
                className={`w-14 text-right text-[11px] ${total < minHours ? "text-(--color-accent-900)" : "text-(--color-text-55)"}`}
              >
                {status}
              </span>
              <ProgressBar hours={total} className="h-[7px] w-16" />
              <span className="w-3 text-center text-[13px] text-(--color-text-50)">{isOpen ? "–" : "+"}</span>
            </button>

            {isOpen && (
              <div className="mt-1 flex flex-col gap-1 pb-1 pl-1">
                {mine.length === 0 ? (
                  <p className="py-1.5 text-[12px] text-(--color-text-50)">No entries logged this week.</p>
                ) : (
                  mine
                    .slice()
                    .sort((a, b) => (a.date < b.date ? 1 : -1))
                    .map((e) => (
                      <div key={e.id} className="flex items-center gap-2 text-[12.5px]">
                        <span className="w-11 shrink-0 uppercase text-(--color-text-50)">
                          {new Date(`${e.date}T00:00:00`).toLocaleDateString("en-US", { weekday: "short" })}
                        </span>
                        <span className="flex-1 text-(--color-text)">{e.session_label}</span>
                        <Tag variant="neutral">
                          {e.source === "tap" ? "Tap" : e.source === "clocked" ? "Clocked" : "Manual"}
                        </Tag>
                        {e.status === "pending" && <Tag variant="outline">Pending</Tag>}
                        {e.status === "rejected" && <Tag variant="accent">Rejected</Tag>}
                        <span className="w-10 text-right font-(family-name:--font-heading) font-semibold">
                          {fmtHours(Number(e.hours))}
                        </span>
                      </div>
                    ))
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
