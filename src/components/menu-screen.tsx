"use client";

import { useState } from "react";
import { ActionButton } from "@/components/action-button";
import { Badge } from "@/components/ui/badge";
import { FIGHTERS, MAX_STRIKES, TOTAL_ROUNDS } from "@/lib/fighters";

type MenuScreenProps = {
  onStart: () => void;
  onRecords: () => void;
  bestScore: number;
  recordsReady: boolean;
};

export function MenuScreen({
  onStart,
  onRecords,
  bestScore,
  recordsReady,
}: MenuScreenProps) {
  const [rulesOpen, setRulesOpen] = useState(false);

  return (
    <div className="relative z-10 mx-auto flex w-full max-w-xl flex-1 flex-col justify-between gap-8 px-4 py-8 sm:py-12">
      <header className="space-y-4 text-center">
        <p className="text-[0.7rem] tracking-[0.42em] text-amber-200/70 uppercase">
          Saturday night card
        </p>
        <h1 className="font-display text-[clamp(5.2rem,22vw,8.5rem)] leading-[0.78] text-amber-50">
          SLAP
          <span className="block bg-linear-to-b from-amber-200 to-amber-600 bg-clip-text text-transparent">
            15
          </span>
        </h1>
        <p className="mx-auto max-w-sm text-pretty text-sm leading-relaxed text-zinc-400 sm:text-base">
          Fifteen hands. One night. Wait for the light, then slap. Jump early
          or arrive late and they take a strike off you.
        </p>
      </header>

      <div className="grid gap-2 rounded-2xl border border-white/8 bg-zinc-950/50 p-3 sm:grid-cols-3">
        <Stat label="Hands" value={String(TOTAL_ROUNDS)} />
        <Stat label="Strikes" value={String(MAX_STRIKES)} />
        <Stat
          label="Best night"
          value={
            !recordsReady ? "—" : bestScore > 0 ? bestScore.toLocaleString() : "None"
          }
        />
      </div>

      <div className="flex flex-col gap-3">
        <ActionButton
          onClick={onStart}
          className="h-14 rounded-2xl bg-amber-400 text-base font-semibold tracking-wide text-zinc-950 hover:bg-amber-300"
        >
          Walk the card
        </ActionButton>
        <div className="grid grid-cols-2 gap-3">
          <ActionButton
            variant="outline"
            onClick={onRecords}
            className="h-12 rounded-2xl border-white/12 bg-zinc-950/40"
          >
            Records
          </ActionButton>
          <ActionButton
            variant="outline"
            onClick={() => setRulesOpen((open) => !open)}
            aria-expanded={rulesOpen}
            className="h-12 rounded-2xl border-white/12 bg-zinc-950/40"
          >
            {rulesOpen ? "Hide rules" : "How it works"}
          </ActionButton>
        </div>
        {rulesOpen ? (
          <div className="rounded-2xl border border-white/10 bg-zinc-950 p-4 text-sm text-zinc-300">
            <p className="font-display text-2xl tracking-wide text-amber-50">
              The rules of the hand
            </p>
            <p className="mt-1 text-zinc-500">
              A timing arena. No guessing. No flinching.
            </p>
            <ol className="mt-4 space-y-3 leading-relaxed">
              <li>
                <strong className="text-amber-200">Wait.</strong> Each opponent
                holds still, then the cue flashes. Space, click, or tap to slap.
              </li>
              <li>
                <strong className="text-amber-200">Don&apos;t jump.</strong> A
                slap before the light is a strike. Later names will twitch to
                bait you.
              </li>
              <li>
                <strong className="text-amber-200">Be first.</strong> Miss the
                window and they hit you. Three strikes and the night is over.
              </li>
              <li>
                <strong className="text-amber-200">Stay sharp.</strong> Perfect
                and clean slaps build a combo. Combo multiplies the score.
              </li>
            </ol>
          </div>
        ) : null}
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl tracking-wide text-zinc-200">
            Tonight&apos;s card
          </h2>
          <Badge variant="secondary" className="bg-zinc-900 text-amber-200">
            15 names
          </Badge>
        </div>
        <ul className="grid max-h-48 gap-1.5 overflow-auto pr-1 sm:max-h-none sm:grid-cols-2">
          {FIGHTERS.map((fighter) => (
            <li
              key={fighter.id}
              className="flex items-center gap-3 rounded-xl border border-white/6 bg-zinc-950/40 px-3 py-2"
            >
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-full font-display text-xs text-zinc-950"
                style={{ background: fighter.accent }}
              >
                {fighter.id}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm text-zinc-100">{fighter.name}</p>
                <p className="truncate text-[0.7rem] tracking-wide text-zinc-500 uppercase">
                  {fighter.nickname}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-zinc-900/80 px-3 py-3 text-center">
      <p className="text-[0.65rem] tracking-[0.2em] text-zinc-500 uppercase">
        {label}
      </p>
      <p className="font-display text-2xl text-amber-100">{value}</p>
    </div>
  );
}
