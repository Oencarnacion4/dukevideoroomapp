"use client";

import { fmtHours } from "@/lib/domain/hours";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import type { Profile, TimeEntry } from "@/lib/types";

interface CopySummaryButtonProps {
  weekLabel: string;
  crew: Profile[];
  entries: TimeEntry[];
  minHours: number;
  capHours: number;
  className?: string;
}

const DIVIDER = "────────────────────";

function buildSummary(
  weekLabel: string,
  crew: Profile[],
  entries: TimeEntry[],
  minHours: number,
  capHours: number,
): string {
  const lines: string[] = [`VIDEO ROOM — HOURS SUMMARY`, weekLabel];

  const rows = crew
    .map((c) => {
      const mine = entries.filter((e) => e.profile_id === c.id && e.status === "approved");
      const total = mine.reduce((sum, e) => sum + Number(e.hours), 0);
      return { c, mine, total };
    })
    // Short-of-minimum people float to the top — that's what needs attention first.
    .sort((a, b) => a.total - b.total);

  const underCount = rows.filter((r) => r.total < minHours).length;
  lines.push(`${underCount} of ${crew.length} crew under the ${minHours}h minimum`);

  for (const { c, mine, total } of rows) {
    lines.push("", DIVIDER, "");
    const status = total >= capHours ? "at cap" : total >= minHours ? "in range" : `${fmtHours(minHours - total)} short`;
    lines.push(`${c.full_name} — ${fmtHours(total)} (${status})`);
    if (mine.length === 0) {
      lines.push("No hours logged.");
      continue;
    }

    const byDate = new Map<string, TimeEntry[]>();
    for (const e of mine) {
      if (!byDate.has(e.date)) byDate.set(e.date, []);
      byDate.get(e.date)!.push(e);
    }
    const dates = [...byDate.keys()].sort();
    for (const date of dates) {
      const day = new Date(`${date}T00:00:00`).toLocaleDateString("en-US", { weekday: "short" });
      const items = byDate
        .get(date)!
        .map((e) => `${e.session_label} (${fmtHours(Number(e.hours))})`)
        .join(", ");
      lines.push(`${day}: ${items}`);
    }
  }

  return lines.join("\n").trimEnd();
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for browsers that block the async clipboard API (e.g. no secure context).
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.focus();
    el.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    document.body.removeChild(el);
    return ok;
  }
}

export function CopySummaryButton({ weekLabel, crew, entries, minHours, capHours, className }: CopySummaryButtonProps) {
  const { show } = useToast();

  const onCopy = async () => {
    const text = buildSummary(weekLabel, crew, entries, minHours, capHours);
    const ok = await copyText(text);
    show(ok ? "Summary copied — paste it into a text or email." : "Couldn't copy — try again.");
  };

  return (
    <Button variant="secondary" onClick={onCopy} className={cn("text-[12.5px]", className)}>
      Copy summary
    </Button>
  );
}
