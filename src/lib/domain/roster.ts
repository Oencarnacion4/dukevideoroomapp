// Roster matching, ported verbatim from the prototype's `matchRoster()`.

function normalize(x: string): string {
  return (x || "").toLowerCase().replace(/[^a-z ]/g, "").trim();
}

/**
 * Finds the roster name a typed name should attach to, in priority order:
 * exact normalized match, then first-name + last-initial match, then
 * either string being a prefix of the other. Returns null if nothing matches.
 */
export function matchRoster(typed: string, names: string[]): string | null {
  const t = normalize(typed);
  if (!t) return null;
  const parts = t.split(/\s+/);

  return (
    names.find((n) => normalize(n) === t) ??
    names.find((n) => {
      const np = normalize(n).split(/\s+/);
      return np[0] === parts[0] && (parts.length === 1 || !np[1] || np[1][0] === parts[1][0]);
    }) ??
    names.find((n) => normalize(n).startsWith(t) || t.startsWith(normalize(n))) ??
    null
  );
}

export type RegisterRole = "intern" | "lead" | "staff";

interface RegisterButtonState {
  disabled: boolean;
  label: string;
}

/** Ported from the README's "Registration button states". */
export function registerButtonState(
  name: string,
  email: string,
  role: RegisterRole,
  matchedName: string | null,
): RegisterButtonState {
  if (!name.trim() || !email.trim()) {
    return { disabled: true, label: "Add your name and email" };
  }
  if (role === "intern" && !matchedName) {
    return { disabled: false, label: "Join and request access" };
  }
  return { disabled: false, label: "Create account" };
}

/** The helper line under the name field on the register screen. */
export function registerHelperLine(role: RegisterRole, matchedName: string | null): string {
  if (role !== "intern") return "Staff accounts do not need a roster entry.";
  if (matchedName) {
    return `✓ Matched to the roster as ${matchedName} — your shifts and hours are already waiting.`;
  }
  return "Not on the roster — you can still join. Staff confirm you afterwards.";
}
