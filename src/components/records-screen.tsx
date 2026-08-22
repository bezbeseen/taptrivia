"use client";

import { Button } from "@/components/ui/button";
import { letterGrade } from "@/lib/game";
import type { StoredRecords } from "@/lib/storage";

type RecordsScreenProps = {
  records: StoredRecords;
  ready: boolean;
  storageError: string | null;
  onBack: () => void;
};

export function RecordsScreen({
  records,
  ready,
  storageError,
  onBack,
}: RecordsScreenProps) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.7rem] tracking-[0.3em] text-amber-200/70 uppercase">
            House book
          </p>
          <h1 className="font-display text-5xl tracking-wide text-amber-50">
            Records
          </h1>
        </div>
        <Button
          variant="outline"
          onClick={onBack}
          className="rounded-xl border-white/12"
        >
          Back
        </Button>
      </header>

      {storageError ? (
        <p className="rounded-xl border border-rose-500/30 bg-rose-950/40 px-3 py-2 text-sm text-rose-100">
          {storageError}
        </p>
      ) : null}

      {!ready ? (
        <div className="space-y-3" aria-busy="true" aria-label="Loading records">
          <div className="h-24 animate-pulse rounded-2xl bg-zinc-900" />
          <div className="h-24 animate-pulse rounded-2xl bg-zinc-900" />
          <div className="h-24 animate-pulse rounded-2xl bg-zinc-900" />
        </div>
      ) : records.runs.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-3xl border border-dashed border-white/12 px-6 py-16 text-center">
          <p className="font-display text-3xl text-zinc-200">No nights yet</p>
          <p className="mt-2 max-w-xs text-sm text-zinc-500">
            Walk the card once and this book keeps the score, the farthest
            hand, and your best combo.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            <RecordStat label="Best score" value={records.bestScore.toLocaleString()} />
            <RecordStat label="Best combo" value={`x${records.bestCombo}`} />
            <RecordStat
              label="Farthest"
              value={`${records.farthestRound}/15`}
            />
          </div>
          <ul className="space-y-2">
            {records.runs.map((run) => (
              <li
                key={run.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-zinc-950/50 px-4 py-3"
              >
                <div>
                  <p className="font-display text-2xl text-amber-100">
                    {run.score.toLocaleString()}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {new Date(run.finishedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    · {run.roundsCompleted}/15 · combo x{run.maxCombo}
                    {run.walkedTheCard ? " · walked it" : ""}
                  </p>
                </div>
                <span className="font-display text-3xl text-amber-400">
                  {letterGrade(run)}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function RecordStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-zinc-950/60 px-3 py-3 text-center">
      <p className="text-[0.65rem] tracking-[0.18em] text-zinc-500 uppercase">
        {label}
      </p>
      <p className="font-display text-2xl text-zinc-100">{value}</p>
    </div>
  );
}
