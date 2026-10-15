import { describe, expect, it } from "vitest";
import { computeGameStats, gameClaimWarning, gameTitle, parseGameSchedule } from "./games";

describe("parseGameSchedule", () => {
  it("parses a full line", () => {
    const { games, errors } = parseGameSchedule("11/2/2026, Army, home, Cameron Indoor Stadium, 7:00 PM");
    expect(errors).toHaveLength(0);
    expect(games).toEqual([
      {
        date: "2026-11-02",
        opponent: "Army",
        homeAway: "home",
        venue: "Cameron Indoor Stadium",
        startLabel: "7:00 PM",
        timeIsPlaceholder: false,
      },
    ]);
  });

  it("fills in venue and time defaults when omitted", () => {
    const { games, errors } = parseGameSchedule("12/30/2026, Georgia Tech, away");
    expect(errors).toHaveLength(0);
    expect(games[0]).toEqual({
      date: "2026-12-30",
      opponent: "Georgia Tech",
      homeAway: "away",
      venue: "TBD",
      startLabel: "7:00 PM",
      timeIsPlaceholder: true,
    });
  });

  it("keeps a comma inside the venue intact (e.g. 'Lawrence, KS') instead of shearing it into the time field", () => {
    const { games, errors } = parseGameSchedule("10/25/2026, Kansas, away, Lawrence, KS, 1:00 PM");
    expect(errors).toHaveLength(0);
    expect(games[0]).toEqual({
      date: "2026-10-25",
      opponent: "Kansas",
      homeAway: "away",
      venue: "Lawrence, KS",
      startLabel: "1:00 PM",
      timeIsPlaceholder: false,
    });
  });

  it("keeps a comma-containing venue with no trailing time", () => {
    const { games, errors } = parseGameSchedule("12/8/2026, Georgia, neutral, New York, NY");
    expect(errors).toHaveLength(0);
    expect(games[0]).toEqual({
      date: "2026-12-08",
      opponent: "Georgia",
      homeAway: "neutral",
      venue: "New York, NY",
      startLabel: "7:00 PM",
      timeIsPlaceholder: true,
    });
  });

  it("accepts ISO dates and short home/away letters", () => {
    const { games, errors } = parseGameSchedule("2026-11-10, Michigan State, n, United Center - Chicago, 7:30 PM");
    expect(errors).toHaveLength(0);
    expect(games[0].date).toBe("2026-11-10");
    expect(games[0].homeAway).toBe("neutral");
  });

  it("skips blank lines", () => {
    const { games, errors } = parseGameSchedule("11/2/2026, Army, home\n\n\n11/5/2026, Coastal Carolina, home");
    expect(errors).toHaveLength(0);
    expect(games).toHaveLength(2);
  });

  it("reports a bad date with the line number", () => {
    const { games, errors } = parseGameSchedule("not-a-date, Army, home");
    expect(games).toHaveLength(0);
    expect(errors).toEqual([{ line: 1, text: "not-a-date, Army, home", reason: expect.stringContaining("date") }]);
  });

  it("reports a missing opponent", () => {
    const { errors } = parseGameSchedule("11/2/2026, , home");
    expect(errors[0].reason).toContain("opponent");
  });

  it("reports an invalid home/away value", () => {
    const { errors } = parseGameSchedule("11/2/2026, Army, somewhere");
    expect(errors[0].reason).toContain("home, away, or neutral");
  });

  it("treats an unparseable trailing chunk as part of the venue, not a bad time", () => {
    // Can't tell a typo'd time apart from a venue with its own extra comma
    // segment, so it falls back to a placeholder time rather than erroring.
    const { games, errors } = parseGameSchedule("11/2/2026, Army, home, Cameron Indoor Stadium, not a time");
    expect(errors).toHaveLength(0);
    expect(games[0].venue).toBe("Cameron Indoor Stadium, not a time");
    expect(games[0].timeIsPlaceholder).toBe(true);
  });

  it("collects multiple games and errors together", () => {
    const { games, errors } = parseGameSchedule(
      ["11/2/2026, Army, home", "garbage line", "11/5/2026, Coastal Carolina, home"].join("\n"),
    );
    expect(games).toHaveLength(2);
    expect(errors).toHaveLength(1);
    expect(errors[0].line).toBe(2);
  });
});

describe("gameTitle", () => {
  it("formats a home game", () => {
    expect(gameTitle({ session_type: "Game", opponent: "Army", home_away: "home" })).toBe("vs. Army");
  });

  it("formats an away game", () => {
    expect(gameTitle({ session_type: "Game", opponent: "Georgia Tech", home_away: "away" })).toBe("at Georgia Tech");
  });

  it("formats a neutral-site game", () => {
    expect(gameTitle({ session_type: "Game", opponent: "Michigan State", home_away: "neutral" })).toBe(
      "Michigan State (neutral)",
    );
  });

  it("falls back to the session type when there's no opponent", () => {
    expect(gameTitle({ session_type: "Full practice", opponent: null, home_away: null })).toBe("Full practice");
  });
});

describe("computeGameStats", () => {
  const shifts = [
    { id: "s1", status: "accepted" as const, assignee_id: "jon" },
    { id: "s2", status: "accepted" as const, assignee_id: "jon" },
    { id: "s3", status: "accepted" as const, assignee_id: "maya" },
    { id: "s4", status: "open" as const, assignee_id: null },
    { id: "s5", status: "declined" as const, assignee_id: "sam" },
  ];

  it("counts claimed from accepted, assigned shifts only", () => {
    const stats = computeGameStats(shifts, []);
    expect(stats["jon"].claimed).toBe(2);
    expect(stats["maya"].claimed).toBe(1);
    expect(stats["sam"]).toBeUndefined();
  });

  it("counts worked from approved entries linked to a game shift, ignoring unrelated or unapproved ones", () => {
    const entries = [
      { profile_id: "jon", status: "approved" as const, shift_id: "s1" },
      { profile_id: "jon", status: "pending" as const, shift_id: "s2" }, // not approved yet — doesn't count
      { profile_id: "maya", status: "approved" as const, shift_id: "s3" },
      { profile_id: "maya", status: "approved" as const, shift_id: null }, // not tied to a shift — doesn't count
      { profile_id: "sam", status: "approved" as const, shift_id: "not-a-game-shift" }, // unknown shift — doesn't count
    ];
    const stats = computeGameStats(shifts, entries);
    expect(stats["jon"].worked).toBe(1);
    expect(stats["maya"].worked).toBe(1);
    expect(stats["sam"]).toBeUndefined();
  });

  it("doesn't double-count duplicate entries for the same shift", () => {
    const entries = [
      { profile_id: "jon", status: "approved" as const, shift_id: "s1" },
      { profile_id: "jon", status: "approved" as const, shift_id: "s1" },
    ];
    const stats = computeGameStats(shifts, entries);
    expect(stats["jon"].worked).toBe(1);
  });
});

describe("gameClaimWarning", () => {
  it("returns null when nobody's notably ahead", () => {
    const stats = { jon: { profileId: "jon", claimed: 1, worked: 0 }, maya: { profileId: "maya", claimed: 1, worked: 0 } };
    expect(gameClaimWarning(stats, "jon", ["jon", "maya"])).toBeNull();
  });

  it("warns once claiming would put someone 2+ games ahead of the lowest", () => {
    const stats = { jon: { profileId: "jon", claimed: 3, worked: 0 }, maya: { profileId: "maya", claimed: 1, worked: 0 } };
    expect(gameClaimWarning(stats, "jon", ["jon", "maya"])).toContain("3 games");
  });

  it("treats an unseen crew member as zero claimed, not exempt", () => {
    const stats = { jon: { profileId: "jon", claimed: 3, worked: 0 } };
    expect(gameClaimWarning(stats, "jon", ["jon", "maya"])).not.toBeNull();
  });
});
