"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  CheckSquare,
  Clock,
  FileText,
  Home,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";

interface Tab {
  href: string;
  label: string;
  icon: typeof Home;
  match: (path: string) => boolean;
}

function tabsFor(role: Role): Tab[] {
  const isAdmin = role === "lead" || role === "staff";
  return [
    { href: "/today", label: "Today", icon: Home, match: (p) => p === "/today" },
    { href: "/schedule", label: "Schedule", icon: CalendarDays, match: (p) => p.startsWith("/schedule") },
    {
      href: "/hours",
      label: role === "staff" ? "Crew hrs" : "Hours",
      icon: Clock,
      match: (p) => p.startsWith("/hours"),
    },
    { href: "/tasks", label: "Tasks", icon: CheckSquare, match: (p) => p.startsWith("/tasks") },
    { href: "/how-tos", label: "Resources", icon: FileText, match: (p) => p.startsWith("/how-tos") },
    {
      href: isAdmin ? "/crew" : "/classes",
      label: isAdmin ? "Crew" : "Classes",
      icon: User,
      match: (p) => p.startsWith("/crew") || p.startsWith("/classes"),
    },
  ];
}

export function TabBar({ role }: { role: Role }) {
  const pathname = usePathname();
  const tabs = tabsFor(role);

  return (
    <nav className="grid grid-cols-6 border-t border-(--color-divider) bg-(--color-bg) pb-6.5">
      {tabs.map((tab) => {
        const active = tab.match(pathname);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-col items-center gap-1 border-t-2 border-transparent pt-2.5 pb-2",
              active ? "border-(--color-accent-800) text-(--color-accent-800)" : "text-(--color-text-50)",
            )}
          >
            <Icon size={20} strokeWidth={1.5} />
            <span className="font-(family-name:--font-heading) text-[11px] font-medium tracking-[0.06em] uppercase">
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
