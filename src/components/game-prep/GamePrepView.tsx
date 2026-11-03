"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { assignScoutAction, removeScoutAction, togglePrepItemAction } from "@/lib/actions/game-prep";
import {
  GAME_PREP_ITEMS,
  gamePrepSummary,
  prepItemDueDate,
  prepItemStatus,
  type GamePrepItemKey,
} from "@/lib/domain/game-prep";
import { gameTitle, type GameSummary } from "@/lib/domain/games";
import { addDays, formatShortDate } from "@/lib/domain/time";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import type { GamePrepItemRow, GameScoutWithProfile } from "@/lib/data/game-prep";

interface CrewOption {
  id: string;
  full_name: string;
}

interface GamePrepViewProps {
  games: GameSummary[];
  prepItems: GamePrepItemRow[];
  scouts: GameScoutWithProfile[];
  assignableCrew: CrewOption[];
  isAdmin: boolean;
  currentProfileId: string;
  today: string;
}

export function GamePrepView({
  games,
  prepItems,
  scouts,
  assignableCrew,
  isAdmin,
  currentProfileId,
  today,
}: GamePrepViewProps) {
  const upcoming = games.filter((g) => g.date >= today);
  const soonCutoff = addDays(today, 14);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pb-6">
      <div>
        <h4 className="font-(family-name:--font-heading) text-[21px] font-semibold">Game prep</h4>
        <p className="text-[13px] text-(--color-text-62)">
          Scouting checklist for each opponent — who&apos;s on it, and what&apos;s due when.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {upcoming.map((game) => {
          const gameItems = prepItems.filter((i) => i.game_date === game.date && i.opponent === game.opponent);
          const doneByKey: Partial<Record<GamePrepItemKey, boolean>> = {};
          for (const item of gameItems) doneByKey[item.item_key] = item.done;
          const summary = gamePrepSummary(doneByKey, game.date, today);
          // Open by default for anything close or already behind — everything further out stays tucked away.
          const defaultOpen = game.date <= soonCutoff || summary.hasOverdue;
          return (
            <GameCard
              key={`${game.date}|${game.opponent}`}
              game={game}
              prepItems={gameItems}
              scouts={scouts.filter((s) => s.game_date === game.date && s.opponent === game.opponent)}
              assignableCrew={assignableCrew}
              isAdmin={isAdmin}
              currentProfileId={currentProfileId}
              today={today}
              defaultOpen={defaultOpen}
            />
          );
        })}
        {upcoming.length === 0 && (
          <p className="py-6 text-center text-[13px] text-(--color-text-50)">No upcoming games yet.</p>
        )}
      </div>
    </div>
  );
}

interface GameCardProps {
  game: GameSummary;
  prepItems: GamePrepItemRow[];
  scouts: GameScoutWithProfile[];
  assignableCrew: CrewOption[];
  isAdmin: boolean;
  currentProfileId: string;
  today: string;
  defaultOpen: boolean;
}

function GameCard({
  game,
  prepItems,
  scouts,
  assignableCrew,
  isAdmin,
  currentProfileId,
  today,
  defaultOpen,
}: GameCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [pending, startTransition] = useTransition();
  const [addTarget, setAddTarget] = useState("");
  const { show } = useToast();

  const doneByKey: Partial<Record<GamePrepItemKey, boolean>> = {};
  for (const item of prepItems) doneByKey[item.item_key] = item.done;

  const summary = gamePrepSummary(doneByKey, game.date, today);
  const iAmScout = scouts.some((s) => s.profile_id === currentProfileId);
  const canToggle = isAdmin || iAmScout;
  const scoutCandidates = assignableCrew.filter((c) => !scouts.some((s) => s.profile_id === c.id));
  const allRequiredDone = summary.doneCount === summary.totalRequired;

  const toggle = (itemKey: GamePrepItemKey, next: boolean) =>
    startTransition(async () => {
      const res = await togglePrepItemAction(game.date, game.opponent, itemKey, next);
      if (res.error) show(res.error);
    });

  const addScout = () =>
    startTransition(async () => {
      if (!addTarget) return;
      const res = await assignScoutAction(game.date, game.opponent, addTarget);
      if (res.error) show(res.error);
      setAddTarget("");
    });

  const removeScout = (id: string) =>
    startTransition(async () => {
      const res = await removeScoutAction(id);
      if (res.error) show(res.error);
    });

  const scoutNames = scouts.map((s) => s.profile?.full_name).filter((n): n is string => !!n);

  return (
    <Card blueprint className="flex flex-col gap-0 p-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-start justify-between gap-2 p-3.5 text-left"
      >
        <div className="flex gap-2">
          {open ? (
            <ChevronDown size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-(--color-text-50)" />
          ) : (
            <ChevronRight size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-(--color-text-50)" />
          )}
          <div>
            <h3 className="font-(family-name:--font-heading) text-[16px] font-semibold">
              {gameTitle({ session_type: "Game", opponent: game.opponent, home_away: game.home_away })}
            </h3>
            <p className="text-[12px] text-(--color-text-50)">
              {formatShortDate(game.date)} · {game.location}
              {!open && scoutNames.length > 0 ? ` · ${scoutNames.join(", ")}` : ""}
            </p>
          </div>
        </div>
        <Tag variant={summary.hasOverdue ? "accent" : allRequiredDone ? "accent" : "outline"}>
          {summary.doneCount}/{summary.totalRequired}
          {summary.hasOverdue ? " · overdue" : ""}
        </Tag>
      </button>

      {open && (
        <div className="flex flex-col gap-3 p-3.5 pt-0">
          <div className="flex flex-col gap-1.5 border-t border-(--color-divider) pt-2.5">
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-(--color-text-55)">
              Scout{scouts.length === 1 ? "" : "s"}
            </p>
            {scouts.length === 0 && <p className="text-[13px] text-(--color-text-50)">Nobody assigned yet.</p>}
            {scouts.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-2">
                <span className="text-[13px]">{s.profile?.full_name ?? "—"}</span>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => removeScout(s.id)}
                    disabled={pending}
                    className="text-[12px] font-medium text-(--color-accent-700)"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            {isAdmin && scoutCandidates.length > 0 && (
              <div className="flex gap-2 pt-1">
                <Select value={addTarget} onChange={(e) => setAddTarget(e.target.value)} className="flex-1">
                  <option value="">Add a scout…</option>
                  {scoutCandidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name}
                    </option>
                  ))}
                </Select>
                <Button variant="secondary" disabled={!addTarget || pending} onClick={addScout}>
                  Add
                </Button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2.5 border-t border-(--color-divider) pt-2.5">
            {GAME_PREP_ITEMS.map((item) => {
              const done = !!doneByKey[item.key];
              const status = prepItemStatus(item, done, game.date, today);
              const due = prepItemDueDate(item, game.date);
              return (
                <label key={item.key} className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={done}
                    disabled={!canToggle || pending}
                    onChange={(e) => toggle(item.key, e.target.checked)}
                    className="mt-0.5 shrink-0"
                  />
                  <span className="flex-1">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[13.5px]">{item.label}</span>
                      {status === "overdue" && <Tag variant="accent">Overdue</Tag>}
                      {status === "due_today" && <Tag variant="outline">Due today</Tag>}
                      {status === "optional" && <Tag variant="neutral">Optional</Tag>}
                    </span>
                    <span className="block text-[11.5px] text-(--color-text-50)">
                      {due ? `Due ${formatShortDate(due)}` : "No deadline"} — {item.hint}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
