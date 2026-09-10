"use client";

import { useTransition } from "react";
import { reviewTimeEntryAction } from "@/lib/actions/hours";
import { fmtHours } from "@/lib/domain/hours";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { useToast } from "@/components/ui/Toast";
import type { TimeEntry } from "@/lib/types";

interface PendingApprovalsProps {
  entries: (TimeEntry & { profileName: string })[];
}

export function PendingApprovals({ entries }: PendingApprovalsProps) {
  const [pending, startTransition] = useTransition();
  const { show } = useToast();

  const review = (id: string, decision: "approved" | "rejected") =>
    startTransition(async () => {
      const result = await reviewTimeEntryAction(id, decision);
      if (result.error) {
        show(result.error);
      } else {
        show(decision === "approved" ? "Approved — added to their total." : "Rejected — won't count.");
      }
    });

  if (entries.length === 0) {
    return <p className="py-2 text-[13px] text-(--color-text-50)">Nothing waiting on you right now.</p>;
  }

  return (
    <div className="flex flex-col gap-2.5">
      {entries
        .slice()
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .map((e) => (
          <div key={e.id} className="flex flex-col gap-1.5 border border-(--color-divider) p-2.5">
            <div className="flex items-center gap-2">
              <span className="flex-1 text-[13.5px] font-medium">{e.profileName}</span>
              <span className="font-(family-name:--font-heading) text-[15px] font-semibold">
                {fmtHours(Number(e.hours))}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[12px] text-(--color-text-62)">
              <span className="w-11 shrink-0 uppercase text-(--color-text-50)">
                {new Date(`${e.date}T00:00:00`).toLocaleDateString("en-US", { weekday: "short" })}
              </span>
              <span className="flex-1">{e.session_label}</span>
              <Tag variant="neutral">{e.source === "clocked" ? "Clocked" : "Manual"}</Tag>
            </div>
            <div className="mt-1 flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                disabled={pending}
                onClick={() => review(e.id, "rejected")}
              >
                Reject
              </Button>
              <Button className="flex-1" disabled={pending} onClick={() => review(e.id, "approved")}>
                Approve
              </Button>
            </div>
          </div>
        ))}
    </div>
  );
}
