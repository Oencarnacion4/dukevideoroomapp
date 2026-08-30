"use client";

import { ArrowLeft, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface OverlayHeaderProps {
  eyebrow: string;
  title: string;
  variant?: "back" | "close";
  onDismiss?: () => void;
}

export function OverlayHeader({ eyebrow, title, variant = "back", onDismiss }: OverlayHeaderProps) {
  const router = useRouter();
  const dismiss = onDismiss ?? (() => router.back());
  const Icon = variant === "close" ? X : ArrowLeft;

  return (
    <header className="flex items-center gap-3 bg-(--color-accent-800) px-4 pt-14 pb-4 text-white">
      <button
        type="button"
        onClick={dismiss}
        aria-label={variant === "close" ? "Close" : "Back"}
        className="flex h-11 w-11 shrink-0 items-center justify-center border border-white/28"
      >
        <Icon size={18} strokeWidth={1.5} />
      </button>
      <div>
        <p className="font-(family-name:--font-heading) text-[11px] font-medium tracking-[0.2em] text-(--color-accent-300) uppercase">
          {eyebrow}
        </p>
        <h1 className="font-(family-name:--font-heading) text-[19px] font-semibold">{title}</h1>
      </div>
    </header>
  );
}
