import { fillColorVar, MIN_TICK_PCT, progressPct } from "@/lib/domain/hours";
import { cn } from "@/lib/utils";

export function ProgressBar({ hours, className }: { hours: number; className?: string }) {
  return (
    <div
      className={cn("relative h-2 bg-[color-mix(in_srgb,var(--color-text)_9%,transparent)]", className)}
    >
      <div
        className="h-full transition-[width]"
        style={{ width: `${progressPct(hours)}%`, background: fillColorVar(hours) }}
      />
      <div
        className="absolute top-0 h-full w-px bg-(--color-text)/30"
        style={{ left: `${MIN_TICK_PCT}%` }}
      />
    </div>
  );
}
