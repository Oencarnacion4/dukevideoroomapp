"use client";

import { cn } from "@/lib/utils";

interface RadioRowProps {
  label: string;
  sub?: string;
  checked: boolean;
  onSelect: () => void;
}

export function RadioRow({ label, sub, checked, onSelect }: RadioRowProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      className="flex w-full items-center justify-between gap-3 border-b border-(--color-divider) py-3 text-left last:border-b-0"
    >
      <span className="flex items-center gap-2.5">
        <span
          className={cn(
            "flex h-[18px] w-[18px] shrink-0 items-center justify-center border",
            checked ? "border-(--color-accent-600)" : "border-(--color-text-50)",
          )}
        >
          {checked && <span className="h-[9px] w-[9px] bg-(--color-accent)" />}
        </span>
        <span className="text-[14px] text-(--color-text)">{label}</span>
      </span>
      {sub && <span className="text-[12px] text-(--color-text-55)">{sub}</span>}
    </button>
  );
}
