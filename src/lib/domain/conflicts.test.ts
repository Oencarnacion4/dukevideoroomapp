import { describe, expect, it } from "vitest";
import { conflictFor, shiftWindow, type AvailabilityBlock } from "./conflicts";

describe("shiftWindow", () => {
  it("uses the actual end time when the shift has one", () => {
    expect(shiftWindow("3:00 PM", "5:45 PM")).toEqual([900, 1065]);
  });

  it("treats an open-ended shift as a 150-minute window", () => {
    expect(shiftWindow("4:15 PM", null)).toEqual([975, 1125]);
  });
});

describe("conflictFor", () => {
  // Tre W. has ECON 101 on Wed, 4:00 PM-5:30 PM, from the handoff's own example.
  const blocks: AvailabilityBlock[] = [
    {
      id: "a1",
      profile_id: "p1",
      day_of_week: "Wed",
      start_time: "4:00 PM",
      end_time: "5:30 PM",
      all_day: false,
      label: "ECON 101",
    },
  ];

  it("flags an overlapping shift on the same day", () => {
    const window = shiftWindow("4:15 PM", "6:15 PM");
    expect(conflictFor(blocks, "Wed", window)?.label).toBe("ECON 101");
  });

  it("does not flag a shift that ends before the block starts", () => {
    const window = shiftWindow("1:00 PM", "3:30 PM");
    expect(conflictFor(blocks, "Wed", window)).toBeNull();
  });

  it("does not flag the same time on a different day", () => {
    const window = shiftWindow("4:15 PM", "6:15 PM");
    expect(conflictFor(blocks, "Thu", window)).toBeNull();
  });

  it("always flags an all-day block on the matching day", () => {
    const allDay: AvailabilityBlock[] = [
      { id: "a2", profile_id: "p1", day_of_week: "Sat", start_time: null, end_time: null, all_day: true, label: "Travel" },
    ];
    const window = shiftWindow("10:00 AM", "1:00 PM");
    expect(conflictFor(allDay, "Sat", window)?.label).toBe("Travel");
  });
});
