"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  zIndex?: number;
  className?: string;
}

export function Dialog({ open, onClose, title, children, zIndex = 60, className }: DialogProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 flex items-end justify-center bg-black/40 sm:items-center"
      style={{ zIndex }}
      onClick={onClose}
    >
      <Card
        blueprint
        className={cn(
          "w-full max-w-[420px] bg-(--color-bg) p-5 shadow-[var(--shadow-lg)]",
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <h4 className="mb-3 font-(family-name:--font-heading) text-[19px] font-semibold text-(--color-text)">
          {title}
        </h4>
        {children}
      </Card>
    </div>
  );
}
