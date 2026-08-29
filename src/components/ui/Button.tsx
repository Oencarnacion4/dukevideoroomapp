import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-1.5 font-(family-name:--font-body) font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-(--color-accent-800) text-white border border-(--color-accent-800) hover:bg-(--color-accent-900)",
  secondary:
    "bg-transparent text-(--color-accent-800) border border-(--color-accent-800) hover:bg-(--color-accent-100)",
  ghost: "bg-transparent text-(--color-accent-700) border-0 hover:text-(--color-accent-900) underline-offset-2 hover:underline px-0",
};

/** Shared classnames for anything styled like a button but not a <button> — e.g. a Link. */
export function buttonClasses(variant: ButtonVariant = "primary", fullWidth = false, className?: string) {
  return cn(
    base,
    variants[variant],
    fullWidth && "w-full",
    variant !== "ghost" && "h-11 px-4 text-[15px]",
    variant === "ghost" && "text-[13px] h-auto",
    className,
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", fullWidth, style, ...props }, ref) => {
    return (
      <button ref={ref} className={buttonClasses(variant, fullWidth, className)} style={style} {...props} />
    );
  },
);
Button.displayName = "Button";
