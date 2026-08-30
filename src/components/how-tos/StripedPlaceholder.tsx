import { cn } from "@/lib/utils";

/** The striped placeholder standing in for an unshot screenshot/recording. */
export function StripedPlaceholder({ label, className }: { label: string; className?: string }) {
  return (
    <div className={cn("relative flex items-center justify-center overflow-hidden bg-(--color-accent-200)", className)}>
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <pattern id="stripe" width="7" height="7" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="7" stroke="var(--color-accent-400)" strokeWidth="2.5" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#stripe)" />
      </svg>
      <span className="relative bg-(--color-bg) px-1.5 py-0.5 font-mono text-[9px] text-(--color-text)">
        {label}
      </span>
    </div>
  );
}
