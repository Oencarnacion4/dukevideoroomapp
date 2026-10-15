"use client";

import { useState, useTransition } from "react";
import { OverlayHeader } from "@/components/chrome/OverlayHeader";
import { Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { importGamesAction } from "@/lib/actions/schedule";
import { GAME_ROLES, parseGameSchedule, type ParseError, type ParsedGame } from "@/lib/domain/games";
import { formatShortDate } from "@/lib/domain/time";

const PLACEHOLDER = `11/2/2026, Army, home, Cameron Indoor Stadium, 7:00 PM
11/5/2026, Coastal Carolina, home
12/30/2026, Georgia Tech, away`;

function opponentLabel(game: ParsedGame): string {
  if (game.homeAway === "away") return `at ${game.opponent}`;
  if (game.homeAway === "neutral") return `${game.opponent} (neutral)`;
  return `vs. ${game.opponent}`;
}

export function GameImportForm() {
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<{ games: ParsedGame[]; errors: ParseError[] } | null>(null);
  const [pending, startTransition] = useTransition();
  const { show } = useToast();

  const parse = () => setParsed(parseGameSchedule(text));

  const confirm = () => {
    if (!parsed || parsed.games.length === 0) return;
    startTransition(async () => {
      const res = await importGamesAction(parsed.games);
      if (res.error) {
        show(res.error);
        return;
      }
      show(
        `Created ${res.created} game${res.created === 1 ? "" : "s"} — ${
          (res.created ?? 0) * GAME_ROLES.length
        } open slots total.`,
      );
      setText("");
      setParsed(null);
    });
  };

  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-(--color-bg)">
      <OverlayHeader eyebrow="Schedule" title="Import season games" variant="close" />
      <div className="flex flex-1 flex-col gap-4 p-4 pb-32">
        <p className="text-[13px] text-(--color-text-62)">
          One game per line: <span className="font-medium text-(--color-text)">Date, Opponent, Home/Away/Neutral,
          Venue, Time</span> — venue and time are optional. Each game gets three open slots —{" "}
          {GAME_ROLES.join(", ")} — ready for the crew to claim themselves.
        </p>

        <Textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setParsed(null);
          }}
          placeholder={PLACEHOLDER}
          rows={10}
        />

        <Button variant="secondary" onClick={parse} disabled={!text.trim()}>
          Preview
        </Button>

        {parsed && (
          <div className="flex flex-col gap-3">
            {parsed.games.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-(--color-text-55)">
                  {parsed.games.length} game{parsed.games.length === 1 ? "" : "s"} ready
                </p>
                {parsed.games.map((g, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 border border-(--color-divider) p-2.5 text-[13px]"
                  >
                    <span>
                      {formatShortDate(g.date)} — {opponentLabel(g)}
                    </span>
                    <span className="text-right text-[12px] text-(--color-text-50)">
                      {g.startLabel}
                      {g.timeIsPlaceholder && " (placeholder)"} · {g.venue}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {parsed.errors.length > 0 && (
              <div className="flex flex-col gap-1.5 border border-(--color-accent-900) p-2.5">
                <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-(--color-accent-900)">
                  {parsed.errors.length} line{parsed.errors.length === 1 ? "" : "s"} skipped
                </p>
                {parsed.errors.map((e) => (
                  <p key={e.line} className="text-[12px] text-(--color-text-62)">
                    Line {e.line}: {e.reason} — &ldquo;{e.text}&rdquo;
                  </p>
                ))}
              </div>
            )}

            {parsed.games.length === 0 && parsed.errors.length === 0 && (
              <p className="text-[13px] text-(--color-text-50)">Nothing to import yet.</p>
            )}
          </div>
        )}
      </div>

      {parsed && parsed.games.length > 0 && (
        <div className="fixed right-0 bottom-0 left-0 mx-auto max-w-[480px] border-t border-(--color-divider) bg-(--color-bg) p-4">
          <Button fullWidth disabled={pending} onClick={confirm}>
            {pending ? "Creating…" : `Create ${parsed.games.length} game${parsed.games.length === 1 ? "" : "s"}`}
          </Button>
        </div>
      )}
    </div>
  );
}
