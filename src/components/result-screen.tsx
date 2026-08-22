"use client";

import { Button } from "@/components/ui/button";
import { FIGHTERS } from "@/lib/fighters";
import { GRADE_COPY, letterGrade, type RunSummary } from "@/lib/game";

type ResultScreenProps = {
  run: RunSummary;
  storageError: string | null;
  onAgain: () => void;
  onMenu: () => void;
};

export function ResultScreen({
  run,
  storageError,
  onAgain,
  onMenu,
}: ResultScreenProps) {
  const grade = letterGrade(run);
  const lastFighter = FIGHTERS[Math.max(run.roundsCompleted - 1, 0)];

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-8">
      <header className="text-center">
        <p className="text-[0.7rem] tracking-[0.32em] text-amber-200/70 uppercase">
          {run.walkedTheCard ? "Walked the card" : "Night over"}
        </p>
        <p className="font-display mt-2 text-[7rem] leading-none text-amber-400">
          {grade}
        </p>
        <h1 className="font-display text-5xl tracking-wide text-amber-50">
          {run.score.toLocaleString()}
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          {run.walkedTheCard
            ? "Fifteen hands and you are still standing."
            : `Stopped on ${lastFighter?.name ?? "the card"} after ${run.strikes} strike${run.strikes === 1 ? "" : "s"}.`}
        </p>
      </header>

      {storageError ? (
        <p className="rounded-xl border border-rose-500/30 bg-rose-950/40 px-3 py-2 text-sm text-rose-100">
          {storageError}
        </p>
      ) : null}

      <div className="grid grid-cols-3 gap-2">
        <Mini label="Hands" value={`${run.roundsCompleted}/15`} />
        <Mini label="Combo" value={`x${run.maxCombo}`} />
        <Mini label="Strikes" value={String(run.strikes)} />
      </div>

      <ul className="max-h-56 space-y-1.5 overflow-auto pr-1">
        {run.results.map((result, index) => {
          const fighter = FIGHTERS.find((item) => item.id === result.fighterId);
          return (
            <li
              key={`${result.fighterId}-${index}`}
              className="flex items-center justify-between rounded-xl border border-white/6 bg-zinc-950/50 px-3 py-2 text-sm"
            >
              <span className="text-zinc-300">
                {index + 1}. {fighter?.name ?? "Unknown"}
              </span>
              <span className="text-amber-100">
                {GRADE_COPY[result.grade].label}
                {result.reactionMs !== null ? ` · ${result.reactionMs}ms` : ""}
                {result.points > 0 ? ` · +${result.points}` : ""}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto flex flex-col gap-3">
        <Button
          onClick={onAgain}
          className="h-14 rounded-2xl bg-amber-400 text-base font-semibold text-zinc-950 hover:bg-amber-300"
        >
          Walk it again
        </Button>
        <Button
          variant="outline"
          onClick={onMenu}
          className="h-12 rounded-2xl border-white/12"
        >
          Back to the door
        </Button>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-zinc-950/60 px-3 py-3 text-center">
      <p className="text-[0.65rem] tracking-[0.18em] text-zinc-500 uppercase">
        {label}
      </p>
      <p className="font-display text-2xl text-zinc-100">{value}</p>
    </div>
  );
}
