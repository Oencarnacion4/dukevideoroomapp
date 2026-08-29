import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  blueprint?: boolean;
  as?: "div" | "button";
}

/**
 * `.card` / `.card.blueprint` from the Industry design system: square
 * corners, hairline border, transparent ground. `blueprint` adds the four
 * `+` registration marks — the one deliberate wireframe affordance.
 */
export function Card({
  className,
  blueprint,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "relative border border-(--color-divider) bg-transparent",
        blueprint && "border-(--color-accent-600)/30",
        className,
      )}
      {...props}
    >
      {blueprint && (
        <>
          <i className="corner tl" />
          <i className="corner tr" />
          <i className="corner bl" />
          <i className="corner br" />
        </>
      )}
      {children}
    </div>
  );
}
