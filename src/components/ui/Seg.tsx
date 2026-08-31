"use client";

import { cn } from "@/lib/utils";

interface SegOption<T extends string> {
  value: T;
  label: string;
}

interface SegProps<T extends string> {
  options: SegOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function Seg<T extends string>({ options, value, onChange, className }: SegProps<T>) {
  return (
    <div
      role="radiogroup"
      className={cn("grid border border-(--color-divider)", className)}
      style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}
    >
      {options.map((opt, i) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "h-11 touch-manipulation text-[13px] font-medium transition-colors",
              i > 0 && "border-l border-(--color-divider)",
              active
                ? "bg-(--color-accent-800) text-white"
                : "bg-transparent text-(--color-text) hover:bg-(--color-accent-100)",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
