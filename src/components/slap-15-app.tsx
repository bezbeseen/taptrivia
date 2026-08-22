"use client";

import { useEffect } from "react";
import { ArenaScreen } from "@/components/arena-screen";
import { MenuScreen } from "@/components/menu-screen";
import { RecordsScreen } from "@/components/records-screen";
import { ResultScreen } from "@/components/result-screen";
import { useSlapGame } from "@/hooks/use-slap-game";
import { cn } from "@/lib/utils";

const ARENA_PHASES = new Set([
  "intro",
  "waiting",
  "feint",
  "live",
  "resolving",
]);

export function Slap15App() {
  const game = useSlapGame();
  const { phase, slap, startNight } = game;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.code !== "Space" && event.code !== "Enter") return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "BUTTON" ||
          target.tagName === "INPUT" ||
          target.isContentEditable)
      ) {
        return;
      }
      event.preventDefault();
      if (phase === "menu" || phase === "over") {
        startNight();
        return;
      }
      slap();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, slap, startNight]);

  return (
    <div
      className={cn(
        "relative z-0 flex min-h-dvh flex-col bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.16),transparent_42%),linear-gradient(180deg,#09090b_0%,#18181b_100%)]",
        game.shake && "arena-shake"
      )}
    >
      {game.phase === "menu" ? (
        <MenuScreen
          onStart={game.startNight}
          onRecords={game.showRecords}
          bestScore={game.records.bestScore}
          recordsReady={game.recordsReady}
        />
      ) : null}
      {game.phase === "records" ? (
        <RecordsScreen
          records={game.records}
          ready={game.recordsReady}
          storageError={game.storageError}
          onBack={game.showMenu}
        />
      ) : null}
      {ARENA_PHASES.has(game.phase) ? (
        <ArenaScreen
          phase={game.phase as "intro" | "waiting" | "feint" | "live" | "resolving"}
          fighter={game.fighter}
          roundIndex={game.roundIndex}
          score={game.score}
          strikes={game.strikes}
          combo={game.combo}
          lastCall={game.lastCall}
          lastCopy={game.lastCopy}
          onSlap={game.slap}
        />
      ) : null}
      {game.phase === "over" && game.run ? (
        <ResultScreen
          run={game.run}
          storageError={game.storageError}
          onAgain={game.startNight}
          onMenu={game.showMenu}
        />
      ) : null}
    </div>
  );
}
