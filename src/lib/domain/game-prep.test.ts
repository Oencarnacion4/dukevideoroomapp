import { describe, expect, it } from "vitest";
import { GAME_PREP_ITEMS, gamePrepItemsFor, gamePrepSummary, prepItemDueDate, prepItemStatus } from "./game-prep";

const personnel = GAME_PREP_ITEMS.find((i) => i.key === "personnel_extendeds")!;
const recentClips = GAME_PREP_ITEMS.find((i) => i.key === "recent_clips")!;

describe("prepItemDueDate", () => {
  it("computes the due date N days before game day", () => {
    expect(prepItemDueDate(personnel, "2026-12-01")).toBe("2026-11-24");
  });

  it("returns null for the optional item", () => {
    expect(prepItemDueDate(recentClips, "2026-12-01")).toBeNull();
  });
});

describe("prepItemStatus", () => {
  it("is done when marked done, regardless of date", () => {
    expect(prepItemStatus(personnel, true, "2026-12-01", "2026-12-01")).toBe("done");
  });

  it("is optional for the no-deadline item", () => {
    expect(prepItemStatus(recentClips, false, "2026-12-01", "2026-11-20")).toBe("optional");
  });

  it("is overdue once today is past the due date and it's not done", () => {
    expect(prepItemStatus(personnel, false, "2026-12-01", "2026-11-25")).toBe("overdue");
  });

  it("is due_today exactly on the due date", () => {
    expect(prepItemStatus(personnel, false, "2026-12-01", "2026-11-24")).toBe("due_today");
  });

  it("is upcoming before the due date", () => {
    expect(prepItemStatus(personnel, false, "2026-12-01", "2026-11-20")).toBe("upcoming");
  });
});

describe("gamePrepSummary", () => {
  it("counts only required items, ignoring the optional one", () => {
    const summary = gamePrepSummary(
      { personnel_extendeds: true, select_clips: false, recent_clips: true },
      "2026-12-01",
      "2026-11-20",
    );
    expect(summary.totalRequired).toBe(4);
    expect(summary.doneCount).toBe(1);
  });

  it("isn't overdue while an undone item's due date hasn't arrived yet", () => {
    // select_clips is due 2026-11-27 (4 days before game); today is still before that.
    const summary = gamePrepSummary({ personnel_extendeds: true }, "2026-12-01", "2026-11-26");
    expect(summary.hasOverdue).toBe(false);
  });

  it("has no overdue when everything required is done", () => {
    const summary = gamePrepSummary(
      {
        personnel_extendeds: true,
        select_clips: true,
        ato_bob_sob: true,
        blue_ribbon: true,
      },
      "2026-12-01",
      "2026-12-01",
    );
    expect(summary.doneCount).toBe(4);
    expect(summary.hasOverdue).toBe(false);
  });

  it("flags overdue when an undone required item's due date has passed", () => {
    const summary = gamePrepSummary({}, "2026-12-01", "2026-12-01");
    expect(summary.hasOverdue).toBe(true);
  });
});

describe("gamePrepItemsFor", () => {
  it("adds Late game, due the same day as Blue Ribbon, for a Power 5 opponent", () => {
    const items = gamePrepItemsFor("North Carolina");
    const lateGame = items.find((i) => i.key === "late_game")!;
    const blueRibbon = items.find((i) => i.key === "blue_ribbon")!;
    expect(lateGame).toBeDefined();
    expect(lateGame.dueDaysBefore).toBe(blueRibbon.dueDaysBefore);
  });

  it("leaves Late game off the checklist for a non-Power 5 opponent", () => {
    const items = gamePrepItemsFor("Coastal Carolina");
    expect(items.find((i) => i.key === "late_game")).toBeUndefined();
  });

  it("totals 5 required items for a Power 5 opponent, 4 otherwise", () => {
    const power5Summary = gamePrepSummary({}, "2026-12-01", "2026-11-01", gamePrepItemsFor("North Carolina"));
    const otherSummary = gamePrepSummary({}, "2026-12-01", "2026-11-01", gamePrepItemsFor("Coastal Carolina"));
    expect(power5Summary.totalRequired).toBe(5);
    expect(otherSummary.totalRequired).toBe(4);
  });
});
