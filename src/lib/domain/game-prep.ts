import { addDays } from "./time";

export type GamePrepItemKey = "personnel_extendeds" | "select_clips" | "ato_bob_sob" | "blue_ribbon" | "recent_clips";

export interface GamePrepItemDef {
  key: GamePrepItemKey;
  label: string;
  hint: string;
  /** Days before game day this is due — null for the optional item, which has no deadline. */
  dueDaysBefore: number | null;
  required: boolean;
}

/** The fixed scouting checklist, ported from the "OPPONENT SCOUTING UPDATE" memo. */
export const GAME_PREP_ITEMS: GamePrepItemDef[] = [
  {
    key: "personnel_extendeds",
    label: "Personnel Extendeds",
    hint: 'One sorter per player ("#? Player Name") with all Possessions + Assists, in a Personnel Extendeds folder on the server under the game folder.',
    dueDaysBefore: 7,
    required: true,
  },
  {
    key: "select_clips",
    label: "Select clips",
    hint: "Watch the extendeds, flag ~20 clips/guy (makes + How-To-Guard), organized into a sorter by player, sent to coaches.",
    dueDaysBefore: 4,
    required: true,
  },
  {
    key: "ato_bob_sob",
    label: "ATOs / BOBs / SOBs",
    hint: "Pulled and on the server.",
    dueDaysBefore: 3,
    required: true,
  },
  {
    key: "blue_ribbon",
    label: "Blue Ribbon + folders",
    hint: "Made (not printed yet).",
    dueDaysBefore: 3,
    required: true,
  },
  {
    key: "recent_clips",
    label: "Recent-game clips",
    hint: "Optional — if the opponent played within a week of us, clip personnel/sets from it if you want. Good practice, not required.",
    dueDaysBefore: null,
    required: false,
  },
];

export type PrepItemStatus = "done" | "overdue" | "due_today" | "upcoming" | "optional";

/** "YYYY-MM-DD" due date for an item relative to the game date, or null for the optional item. */
export function prepItemDueDate(item: GamePrepItemDef, gameDate: string): string | null {
  if (item.dueDaysBefore == null) return null;
  return addDays(gameDate, -item.dueDaysBefore);
}

export function prepItemStatus(item: GamePrepItemDef, done: boolean, gameDate: string, today: string): PrepItemStatus {
  if (done) return "done";
  if (item.dueDaysBefore == null) return "optional";
  const due = prepItemDueDate(item, gameDate)!;
  if (due < today) return "overdue";
  if (due === today) return "due_today";
  return "upcoming";
}

export interface GamePrepSummary {
  doneCount: number;
  totalRequired: number;
  hasOverdue: boolean;
}

/** Roll-up for a game's list row: how much of the required checklist is done, and whether anything's overdue. */
export function gamePrepSummary(
  doneByKey: Partial<Record<GamePrepItemKey, boolean>>,
  gameDate: string,
  today: string,
): GamePrepSummary {
  const required = GAME_PREP_ITEMS.filter((item) => item.required);
  const doneCount = required.filter((item) => doneByKey[item.key]).length;
  const hasOverdue = required.some(
    (item) => !doneByKey[item.key] && prepItemStatus(item, false, gameDate, today) === "overdue",
  );
  return { doneCount, totalRequired: required.length, hasOverdue };
}
