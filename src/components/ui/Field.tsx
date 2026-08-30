import { forwardRef } from "react";
import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

// 16px, not the design system's 15px: anything smaller makes iOS Safari
// auto-zoom the viewport on focus, which is jarring in an installed PWA
// and doesn't zoom back out on its own. The 1px difference is invisible
// in practice.
const controlBase =
  "w-full border border-(--color-divider) bg-transparent px-3 h-11 text-[16px] text-(--color-text) placeholder:text-(--color-text-50) focus-visible:border-(--color-accent-600)";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(controlBase, className)} {...props} />
  ),
);
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(controlBase, "h-auto min-h-22 py-2.5 resize-none", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn(controlBase, "appearance-none", className)} {...props}>
      {children}
    </select>
  ),
);
Select.displayName = "Select";

interface FieldProps {
  label: string;
  htmlFor?: string;
  helper?: ReactNode;
  helperClassName?: string;
  children: ReactNode;
  labelProps?: LabelHTMLAttributes<HTMLLabelElement>;
}

export function Field({ label, htmlFor, helper, helperClassName, children, labelProps }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        {...labelProps}
        className={cn(
          "font-(family-name:--font-heading) text-[10px] font-medium uppercase tracking-[0.08em] text-(--color-text-55)",
          labelProps?.className,
        )}
      >
        {label}
      </label>
      {children}
      {helper && (
        <p className={cn("text-[12.5px] leading-snug text-(--color-text-62)", helperClassName)}>
          {helper}
        </p>
      )}
    </div>
  );
}
