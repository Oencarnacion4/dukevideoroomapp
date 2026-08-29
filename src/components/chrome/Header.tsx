"use client";

import Link from "next/link";
import { Bell } from "lucide-react";

interface HeaderProps {
  badgeCount?: number;
}

export function Header({ badgeCount = 0 }: HeaderProps) {
  return (
    <header className="bg-(--color-accent-800) px-4 pt-14 pb-3 text-white">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-(family-name:--font-heading) text-[11px] font-medium tracking-[0.22em] text-(--color-accent-300) uppercase">
            Duke men&apos;s basketball
          </p>
          <h1 className="font-(family-name:--font-heading) text-[26px] leading-[1.05] font-semibold">
            Video room
          </h1>
        </div>
        <Link
          href="/alerts"
          className="relative flex h-[38px] w-[38px] shrink-0 items-center justify-center border border-white/28"
        >
          <Bell size={19} strokeWidth={1.5} />
          {badgeCount > 0 && (
            <span className="absolute -top-[5px] -right-[5px] flex h-[17px] min-w-[17px] items-center justify-center bg-white px-[3px] font-(family-name:--font-heading) text-[11px] font-medium text-(--color-accent-800)">
              {badgeCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
