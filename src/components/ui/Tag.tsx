import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "accent" | "outline" | "neutral";

interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

const variants: Record<Variant, string> = {
  accent: "bg-(--color-accent-800) text-white border-(--color-accent-800)",
  outline: "bg-transparent text-(--color-accent-800) border-(--color-accent-800)",
  neutral: "bg-transparent text-(--color-text-55) border-(--color-divider)",
};

export function Tag({ className, variant = "neutral", ...props }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center border px-1.5 py-0.5 font-(family-name:--font-heading) text-[10px] font-medium uppercase tracking-[0.06em]",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
