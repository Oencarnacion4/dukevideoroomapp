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

function buildSummary(
  weekLabel: string,
  crew: Profile[],
  entries: TimeEntry[],
  minHours: number,
  capHours: number,
): string {
  const lines: string[] = [`Video Room Crew — Hours, ${weekLabel}`, ""];

  const rows = crew
    .map((c) => {
      const mine = entries.filter((e) => e.profile_id === c.id && e.status === "approved");
      const total = mine.reduce((sum, e) => sum + Number(e.hours), 0);
      return { c, mine, total };
    })
    .sort((a, b) => b.total - a.total);

  const underCount = rows.filter((r) => r.total < minHours).length;
  lines.push(`${underCount} of ${crew.length} under the ${minHours}h minimum`, "");

  for (const { c, mine, total } of rows) {
    const status = total >= capHours ? "at cap" : total >= minHours ? "in range" : `${fmtHours(minHours - total)} short`;
    lines.push(`${c.full_name} — ${fmtHours(total)} (${status})`);
    if (mine.length === 0) {
      lines.push("  No approved hours logged.");
    } else {
      const sorted = [...mine].sort((a, b) => (a.date < b.date ? -1 : 1));
      for (const e of sorted) {
        const day = new Date(`${e.date}T00:00:00`).toLocaleDateString("en-US", { weekday: "short" });
        const source = e.source === "tap" ? "Tap" : e.source === "clocked" ? "Clocked" : "Manual";
        lines.push(`  ${day}  ${e.session_label} — ${fmtHours(Number(e.hours))} (${source})`);
      }
    }
    lines.push("");
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
