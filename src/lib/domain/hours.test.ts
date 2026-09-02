import { describe, expect, it } from "vitest";
import { fmtHours, hoursVerdict, liveDurationLabel, progressPct, roundClockedHours } from "./hours";

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
  it("rounds to the nearest minute, no 15-minute floor", () => {
    expect(roundClockedHours(5 / 3600)).toBe(0); // 5 seconds -> 0 min, not 0.25h
    expect(roundClockedHours(8 / 60)).toBeCloseTo(8 / 60, 5); // 8 minutes
  });

  it("rounds to the nearest minute for longer sessions", () => {
    expect(roundClockedHours(1.32)).toBeCloseTo(79 / 60, 5); // 1h 19m 12s -> 1h 19m
    expect(roundClockedHours(1.4)).toBeCloseTo(84 / 60, 5); // 1h 24m
  });
});

describe("liveDurationLabel", () => {
  it("shows minutes under an hour", () => {
    expect(liveDurationLabel(8 / 60)).toBe("8 min");
    expect(liveDurationLabel(0)).toBe("0 min");
  });

  it("shows whole hours without a minutes remainder", () => {
    expect(liveDurationLabel(2)).toBe("2h");
  });

  it("shows hours and minutes together", () => {
    expect(liveDurationLabel(1.25)).toBe("1h 15m");
  });
});
