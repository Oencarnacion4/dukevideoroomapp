"use client";

import { useId } from "react";
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

/**
 * Built on real `<input type="radio">` elements (visually hidden, one per
 * option) rather than plain buttons with a click handler — native radio
 * inputs are the most reliably-handled interactive element across every
 * browser, so selecting an option never depends on a custom click
 * listener actually firing.
 */
export function Seg<T extends string>({ options, value, onChange, className }: SegProps<T>) {
  const groupName = useId();

  return (
    <div className={cn("grid border border-(--color-divider)", className)} style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map((opt, i) => {
        const active = opt.value === value;
        const id = `${groupName}-${opt.value}`;
        return (
          <label
            key={opt.value}
            htmlFor={id}
            className={cn(
              "flex h-11 cursor-pointer touch-manipulation items-center justify-center text-[13px] font-medium transition-colors",
              i > 0 && "border-l border-(--color-divider)",
              active
                ? "bg-(--color-accent-800) text-white"
                : "bg-transparent text-(--color-text) hover:bg-(--color-accent-100)",
            )}
          >
            <input
              type="radio"
              id={id}
              name={groupName}
              value={opt.value}
              checked={active}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            {opt.label}
          </label>
        );
      })}
    </div>
  );
}
