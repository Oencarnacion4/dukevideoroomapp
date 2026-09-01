import type { ShiftStatus } from "@/lib/types";

export function shiftStatusMeta(status: ShiftStatus): { label: string; variant: "accent" | "outline" | "neutral" } {
  switch (status) {
    case "accepted":
      return { label: "Accepted", variant: "accent" };
    case "declined":
      return { label: "Declined", variant: "neutral" };
    case "swap_sent":
      return { label: "Swap sent", variant: "outline" };
    case "open":
      return { label: "Open slot", variant: "outline" };
    case "proposed":
      return { label: "Awaiting approval", variant: "outline" };
    default:
      return { label: "Needs reply", variant: "outline" };
  }
}

export function initialsFor(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("");
}
