import { describe, expect, it } from "vitest";
import { labelToPgTime, pgTimeToLabel, spanLabel, toMinutes } from "./time";

describe("toMinutes", () => {
  it("parses AM/PM labels", () => {
    expect(toMinutes("3:00 PM")).toBe(900);
    expect(toMinutes("12:00 AM")).toBe(0);
    expect(toMinutes("12:00 PM")).toBe(720);
  });
});

describe("spanLabel", () => {
  it("returns Open end when there's no end time", () => {
    expect(spanLabel("3:00 PM", null)).toBe("Open end");
  });

  it("formats a duration with hours and minutes", () => {
    expect(spanLabel("3:00 PM", "5:45 PM")).toBe("2h 45m");
  });

  it("formats a whole-hour duration without minutes", () => {
    expect(spanLabel("10:00 AM", "1:00 PM")).toBe("3h");
  });
});

describe("pgTimeToLabel / labelToPgTime", () => {
  it("round-trips through Postgres time format", () => {
    expect(pgTimeToLabel("15:00:00")).toBe("3:00 PM");
    expect(labelToPgTime("3:00 PM")).toBe("15:00:00");
  });

  it("handles midnight and noon", () => {
    expect(pgTimeToLabel("00:00:00")).toBe("12:00 AM");
    expect(pgTimeToLabel("12:00:00")).toBe("12:00 PM");
  });
});
