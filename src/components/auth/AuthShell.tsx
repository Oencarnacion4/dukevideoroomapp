import type { ReactNode } from "react";

interface AuthShellProps {
  eyebrow: string;
  title: ReactNode;
  tagline: string;
  children: ReactNode;
}

/**
 * Shared shell for Sign in / Register: a navy field with the wordmark
 * bottom-aligned, and a card below it on the page ground.
 */
export function AuthShell({ eyebrow, title, tagline, children }: AuthShellProps) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-(--color-bg)">
      <div className="flex flex-1 flex-col justify-end bg-(--color-accent-800) px-6 pb-8 pt-16 text-white">
        <p className="font-(family-name:--font-heading) text-[12px] font-medium tracking-[0.24em] text-(--color-accent-300) uppercase">
          {eyebrow}
        </p>
        <h1 className="font-(family-name:--font-heading) text-[52px] leading-[0.95] font-semibold">
          {title}
        </h1>
        <p className="mt-3 max-w-[260px] text-[13.5px] text-(--color-accent-200)">{tagline}</p>
      </div>
      <div className="flex flex-col gap-3 px-6 pt-5 pb-[34px]">{children}</div>
    </div>
  );
}
