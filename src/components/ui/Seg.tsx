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
 * option) for correct semantics, but the label also has its own onClick —
 * Safari has a known quirk where a `display:flex` label can fail to
 * forward a click to its associated hidden input, so selection can't rely
 * on that native label-to-input delegation alone.
 */
export function Seg<T extends string>({ options, value, onChange, className }: SegProps<T>) {
  const groupName = useId();

  return (
    <div
      className={cn("grid select-none border border-(--color-divider)", className)}
      style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}
    >
      {options.map((opt, i) => {
        const active = opt.value === value;
        const id = `${groupName}-${opt.value}`;
        return (
          <label
            key={opt.value}
            htmlFor={id}
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex h-11 cursor-pointer touch-manipulation select-none items-center justify-center text-[13px] font-medium transition-colors",
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
