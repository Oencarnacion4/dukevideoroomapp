import { describe, expect, it } from "vitest";
import { fmtHours, hoursVerdict, progressPct, roundClockedHours } from "./hours";

describe("fmtHours", () => {
  it("rounds to the quarter hour and trims trailing zeros", () => {
    expect(fmtHours(2.5)).toBe("2.5 h");
    expect(fmtHours(3)).toBe("3 h");
    expect(fmtHours(1.24)).toBe("1.25 h");
  });
});

describe("progressPct", () => {
  it("caps at 100% for anything at or above the 15h cap", () => {
    expect(progressPct(15)).toBe(100);
    expect(progressPct(20)).toBe(100);
  });

  it("puts the 10h minimum at two-thirds of the bar", () => {
    expect(progressPct(10)).toBeCloseTo(66.67, 1);
  });
});

describe("hoursVerdict", () => {
  it("reports the shortfall under 10 hours", () => {
    expect(hoursVerdict(8)).toBe("2 h short of the 10 h minimum");
  });

  it("says in range between 10 and 15", () => {
    expect(hoursVerdict(12)).toBe("In range — you are good");
  });

  it("says at the top of the range at or above 15", () => {
    expect(hoursVerdict(15)).toBe("At the top of the range");
  });
});

describe("roundClockedHours", () => {
  it("floors at a quarter hour", () => {
    expect(roundClockedHours(0.05)).toBe(0.25);
  });

  it("rounds to the nearest quarter hour", () => {
    expect(roundClockedHours(1.32)).toBe(1.25);
    expect(roundClockedHours(1.4)).toBe(1.5);
  });
});
