import { describe, expect, it } from "vitest";
import { computeFreeGrid } from "./free-time";
import type { AvailabilityBlock } from "./conflicts";

const crew = [
  { id: "a", full_name: "Alex" },
  { id: "b", full_name: "Bea" },
];
const days = ["Mon", "Tue"] as const;
const dayDates = ["2026-09-14", "2026-09-15"];

function block(overrides: Partial<AvailabilityBlock>): AvailabilityBlock {
  return {
    id: "blk",
    profile_id: "a",
    day_of_week: "Mon",
    specific_date: null,
    start_time: "10:00 AM",
    end_time: "11:00 AM",
    all_day: false,
    label: "ECON 101",
    kind: "busy",
    ...overrides,
  };
}

describe("computeFreeGrid", () => {
  it("marks everyone free when there's nothing on the books", () => {
    const grid = computeFreeGrid(crew, [], [], days, dayDates, 9 * 60, 11 * 60, 60);
    expect(grid[0].slots.every((s) => s.freeIds.length === 2 && s.busy.length === 0)).toBe(true);
  });

  it("marks a person busy only during their class window, not before or after", () => {
    const grid = computeFreeGrid(crew, [block({})], [], days, dayDates, 9 * 60, 12 * 60, 60);
    const mon = grid[0].slots;
    // 9-10am: free
    expect(mon[0].freeIds).toContain("a");
    // 10-11am: busy (class)
    expect(mon[1].freeIds).not.toContain("a");
    expect(mon[1].busy).toEqual([{ id: "a", reason: "ECON 101" }]);
    // 11am-12pm: free again
    expect(mon[2].freeIds).toContain("a");
  });

  it("doesn't leak a Monday-only recurring block into Tuesday", () => {
    const grid = computeFreeGrid(crew, [block({})], [], days, dayDates, 10 * 60, 11 * 60, 60);
    expect(grid[1].slots[0].freeIds).toContain("a");
  });

  it("treats an all-day block as busy for the whole window", () => {
    const grid = computeFreeGrid(
      crew,
      [block({ all_day: true, start_time: null, end_time: null, label: "Sick" })],
      [],
      days,
      dayDates,
      8 * 60,
      20 * 60,
      60,
    );
    expect(grid[0].slots.every((s) => !s.freeIds.includes("a"))).toBe(true);
  });

  it("respects a one-time block only on its specific date, even if the day of week recurs", () => {
    const grid = computeFreeGrid(
      crew,
      [block({ specific_date: "2026-09-14", day_of_week: "Mon" })],
      [],
      ["Mon", "Mon"] as const,
      ["2026-09-14", "2026-09-21"],
      10 * 60,
      11 * 60,
      60,
    );
    expect(grid[0].slots[0].freeIds).not.toContain("a");
    expect(grid[1].slots[0].freeIds).toContain("a");
  });

  it("counts an accepted shift as busy but ignores a declined one", () => {
    const shifts = [
      { assignee_id: "b", status: "accepted", date: "2026-09-14", start_time: "1:00 PM", end_time: "3:00 PM", session_type: "Full practice" },
      { assignee_id: "a", status: "declined", date: "2026-09-14", start_time: "1:00 PM", end_time: "3:00 PM", session_type: "Full practice" },
    ];
    const grid = computeFreeGrid(crew, [], shifts, days, dayDates, 13 * 60, 14 * 60, 60);
    expect(grid[0].slots[0].freeIds).toEqual(["a"]);
    expect(grid[0].slots[0].busy).toEqual([{ id: "b", reason: "Full practice" }]);
  });

  it("treats an open-ended shift as a 150-minute window, per shiftWindow's heuristic", () => {
    const shifts = [
      { assignee_id: "a", status: "accepted", date: "2026-09-14", start_time: "1:00 PM", end_time: null, session_type: "Extra time" },
    ];
    const grid = computeFreeGrid(crew, [], shifts, days, dayDates, 13 * 60, 16 * 60, 30);
    // 1:00-3:30pm covered by the 150-min heuristic, 3:30pm+ free again
    expect(grid[0].slots.find((s) => s.startMin === 13 * 60)!.freeIds).not.toContain("a");
    expect(grid[0].slots.find((s) => s.startMin === 15 * 60)!.freeIds).not.toContain("a");
    expect(grid[0].slots.find((s) => s.startMin === 15 * 60 + 30)!.freeIds).toContain("a");
  });
});
