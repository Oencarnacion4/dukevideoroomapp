import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-1.5 font-(family-name:--font-body) font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary:
    "bg-(--color-accent-800) text-white border border-(--color-accent-800) hover:bg-(--color-accent-900)",
  secondary:
    "bg-transparent text-(--color-accent-800) border border-(--color-accent-800) hover:bg-(--color-accent-100)",
  ghost: "bg-transparent text-(--color-accent-700) border-0 hover:text-(--color-accent-900) underline-offset-2 hover:underline px-0",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", fullWidth, style, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          base,
          variants[variant],
          fullWidth && "w-full",
          variant !== "ghost" && "h-11 px-4 text-[15px]",
          variant === "ghost" && "text-[13px] h-auto",
          className,
        )}
        style={style}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
