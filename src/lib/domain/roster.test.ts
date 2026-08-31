import { describe, expect, it } from "vitest";
import { matchRoster, registerButtonState, registerHelperLine } from "./roster";

const ROSTER = ["Jordan R.", "Maya P.", "Tre W.", "Sam K.", "Devin L.", "Ana G."];

describe("matchRoster", () => {
  it("matches an exact normalized name", () => {
    expect(matchRoster("jordan r.", ROSTER)).toBe("Jordan R.");
  });

  it("matches first name + last initial", () => {
    expect(matchRoster("maya", ROSTER)).toBe("Maya P.");
  });

  it("matches when either string is a prefix of the other", () => {
    expect(matchRoster("Tre", ROSTER)).toBe("Tre W.");
  });

  it("returns null when nothing matches", () => {
    expect(matchRoster("Nobody Here", ROSTER)).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(matchRoster("   ", ROSTER)).toBeNull();
  });

  it("ignores case and punctuation", () => {
    expect(matchRoster("SAM k", ROSTER)).toBe("Sam K.");
  });
});

describe("registerButtonState", () => {
  it("hints to fill in name and email but leaves the button clickable — native `required` blocks an empty submit instead", () => {
    expect(registerButtonState("", "a@b.com", "intern", null)).toEqual({
      disabled: false,
      label: "Add your name and email",
    });
    expect(registerButtonState("Jordan R.", "", "intern", null)).toEqual({
      disabled: false,
      label: "Add your name and email",
    });
  });

  it("prompts to join and request access for an unmatched intern", () => {
    expect(registerButtonState("Nobody", "a@b.com", "intern", null)).toEqual({
      disabled: false,
      label: "Join and request access",
    });
  });

  it("says Create account for a matched intern or any admin", () => {
    expect(registerButtonState("Jordan R.", "a@b.com", "intern", "Jordan R.")).toEqual({
      disabled: false,
      label: "Create account",
    });
    expect(registerButtonState("New Staffer", "a@b.com", "staff", null)).toEqual({
      disabled: false,
      label: "Create account",
    });
  });
});

describe("registerHelperLine", () => {
  it("confirms a roster match", () => {
    expect(registerHelperLine("intern", "Maya P.")).toBe(
      "✓ Matched to the roster as Maya P. — your shifts and hours are already waiting.",
    );
  });

  it("explains an unmatched intern can still join", () => {
    expect(registerHelperLine("intern", null)).toBe(
      "Not on the roster — you can still join. Staff confirm you afterwards.",
    );
  });

  it("tells admins they don't need a roster entry", () => {
    expect(registerHelperLine("lead", null)).toBe("Staff accounts do not need a roster entry.");
  });
});
