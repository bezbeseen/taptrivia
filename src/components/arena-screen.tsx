"use client";

import { ActionButton } from "@/components/action-button";
import { Progress } from "@/components/ui/progress";
import { MAX_STRIKES, TOTAL_ROUNDS, type Fighter } from "@/lib/fighters";
import type { Grade, Phase } from "@/lib/game";
import { cn } from "@/lib/utils";

type ArenaScreenProps = {
  phase: Extract<Phase, "intro" | "waiting" | "feint" | "live" | "resolving">;
  fighter: Fighter;
  roundIndex: number;
  score: number;
  strikes: number;
  combo: number;
  lastCall: {
    grade: Grade;
    reactionMs: number | null;
    points: number;
    combo: number;
  } | null;
  lastCopy: { label: string; line: string } | null;
  onSlap: () => void;
};

const PHASE_LINE: Record<ArenaScreenProps["phase"], string> = {
  intro: "Study the hands",
  waiting: "Wait for the light",
  feint: "Not yet",
  live: "Now",
  resolving: "Call it",
};

export function ArenaScreen({
  phase,
  fighter,
  roundIndex,
  score,
  strikes,
  combo,
  lastCall,
  lastCopy,
  onSlap,
}: ArenaScreenProps) {
  const live = phase === "live";
  const baited = phase === "feint";
  const resolving = phase === "resolving";
  const canSlap = phase === "waiting" || phase === "feint" || phase === "live";

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 px-4 py-5 sm:py-8">
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[0.65rem] tracking-[0.28em] text-amber-200/70 uppercase">
            Hand {roundIndex + 1} / {TOTAL_ROUNDS}
          </p>
          <p className="font-display text-3xl leading-none text-amber-50">
            {score.toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {combo > 1 ? (
            <span className="rounded-full bg-amber-400/15 px-2.5 py-1 text-xs font-medium text-amber-200">
              x{combo} combo
            </span>
          ) : null}
          <div className="flex gap-1.5" aria-label={`${strikes} of ${MAX_STRIKES} strikes`}>
            {Array.from({ length: MAX_STRIKES }, (_, i) => (
              <span
                key={i}
                className={cn(
                  "size-2.5 rounded-full",
                  i < strikes ? "bg-rose-500" : "bg-zinc-700"
                )}
              />
            ))}
          </div>
        </div>
      </header>

      <Progress
        value={((roundIndex + (resolving ? 1 : 0)) / TOTAL_ROUNDS) * 100}
        className="h-1 bg-zinc-800"
      />

      <div
        className={cn(
          "relative flex flex-1 flex-col items-center justify-center overflow-hidden rounded-[2rem] border px-5 py-8 text-center transition-colors",
          live
            ? "border-amber-300 bg-amber-400 text-zinc-950"
            : baited
              ? "border-rose-400/40 bg-rose-950/50 text-rose-100"
              : resolving && lastCall?.grade === "perfect"
                ? "border-amber-300/40 bg-amber-400/10 text-amber-50"
                : resolving && (lastCall?.grade === "early" || lastCall?.grade === "hit")
                  ? "border-rose-400/30 bg-rose-950/40 text-rose-50"
                  : "border-white/8 bg-zinc-950/70 text-zinc-100"
        )}
      >
        <p className="text-[0.7rem] tracking-[0.35em] uppercase opacity-70">
          {PHASE_LINE[phase]}
        </p>

        <div
          className="mt-5 mb-4 flex size-28 items-center justify-center rounded-full font-display text-4xl sm:size-32"
          style={{
            background: live ? "rgba(24,24,27,0.92)" : fighter.accent,
            color: live ? fighter.accent : "#18181b",
            boxShadow: live ? `0 0 0 10px ${fighter.accent}` : undefined,
          }}
        >
          {fighter.initials}
        </div>

        <h2 className="font-display text-4xl tracking-wide sm:text-5xl">
          {fighter.name}
        </h2>
        <p className="mt-1 text-sm tracking-[0.2em] uppercase opacity-70">
          {fighter.nickname} · {fighter.record} · {fighter.stance}
        </p>
        <p className="mt-4 max-w-sm text-pretty text-sm opacity-80">
          {resolving && lastCopy ? lastCopy.line : fighter.note}
        </p>

        {live ? (
          <p className="font-display mt-6 text-6xl tracking-[0.12em] sm:text-7xl">
            SLAP
          </p>
        ) : null}

        {resolving && lastCall && lastCopy ? (
          <div className="mt-6 space-y-1">
            <p className="font-display text-5xl tracking-wide">{lastCopy.label}</p>
            <p className="text-sm opacity-80">
              {lastCall.reactionMs !== null
                ? `${lastCall.reactionMs} ms · +${lastCall.points.toLocaleString()}`
                : lastCall.grade === "early"
                  ? "Flinch"
                  : "Got tagged"}
            </p>
          </div>
        ) : null}
      </div>

      <ActionButton
        onClick={onSlap}
        disabled={!canSlap}
        className={cn(
          "h-20 rounded-[1.6rem] font-display text-3xl tracking-[0.18em] sm:h-24 sm:text-4xl",
          live
            ? "bg-zinc-950 text-amber-300 hover:bg-zinc-900"
            : "bg-amber-400 text-zinc-950 hover:bg-amber-300 disabled:opacity-40"
        )}
      >
        {canSlap ? "SLAP" : lastCopy?.label ?? "HOLD"}
      </ActionButton>
      <p className="text-center text-xs text-zinc-500">
        Tap the pad, click, or press Space
      </p>
    </div>
  );
}
