"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { PlayerAvatar } from "@/components/player-avatar";
import {
  playGoSound,
  playSlapSound,
  playUiTap,
  playWrongSound,
} from "@/lib/sounds";

export type TableSlapPlayer = {
  name: string;
  avatar: number;
};

const PAD_COLORS = [
  "#fb923c",
  "#4ade80",
  "#38bdf8",
  "#e879f9",
  "#facc15",
  "#fb7185",
  "#a3e635",
  "#818cf8",
];

type Phase = "ready" | "wait" | "go" | "restart" | "winner";

function splitSeats<T>(players: T[]) {
  const nearCount = Math.max(1, Math.ceil(players.length / 2));
  return {
    near: players.map((player, index) => ({ player, index })).slice(0, nearCount),
    far: players.map((player, index) => ({ player, index })).slice(nearCount),
  };
}

function buzz(ms: number) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* iPad has no haptic motor. */
  }
}

export function TableSlap({
  players,
  onDone,
}: {
  players: TableSlapPlayer[];
  onDone: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("ready");
  const [roundId, setRoundId] = useState(0);
  const [falseStarts, setFalseStarts] = useState<Set<number>>(() => new Set());
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null);
  const phaseRef = useRef<Phase>("ready");
  const falseStartsRef = useRef<Set<number>>(falseStarts);
  const resolvedRef = useRef(false);
  const doneRef = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const onDoneRef = useRef(onDone);
  const playerCount = players.length;

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDoneRef.current();
  }, []);

  const skip = useCallback(() => {
    if (doneRef.current) return;
    playUiTap();
    finish();
  }, [finish]);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    falseStartsRef.current = falseStarts;
  }, [falseStarts]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const blockScroll = (event: TouchEvent) => event.preventDefault();
    node.addEventListener("touchmove", blockScroll, { passive: false });
    return () => node.removeEventListener("touchmove", blockScroll);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") skip();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [skip]);

  useEffect(() => {
    if (phase !== "ready") return;
    const timer = window.setTimeout(() => {
      phaseRef.current = "wait";
      setPhase("wait");
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "wait") return;
    const delay = 800 + Math.random() * 2200;
    const timer = window.setTimeout(() => {
      phaseRef.current = "go";
      setPhase("go");
      playGoSound();
      buzz(40);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [phase, roundId]);

  useEffect(() => {
    if (phase !== "restart") return;
    const timer = window.setTimeout(() => {
      falseStartsRef.current = new Set();
      setFalseStarts(new Set());
      setWinnerIndex(null);
      setRoundId((value) => value + 1);
      phaseRef.current = "wait";
      setPhase("wait");
    }, 1100);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "winner") return;
    const timer = window.setTimeout(() => finish(), 1800);
    return () => window.clearTimeout(timer);
  }, [finish, phase]);

  const slap = (index: number, event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (resolvedRef.current || doneRef.current) return;
    const current = phaseRef.current;
    if (current === "ready" || current === "restart") {
      return;
    }
    if (current === "winner") {
      finish();
      return;
    }
    if (falseStartsRef.current.has(index)) return;
    if (current === "wait") {
      playWrongSound();
      buzz(18);
      const next = new Set(falseStartsRef.current);
      next.add(index);
      falseStartsRef.current = next;
      setFalseStarts(next);
      if (playerCount > 0 && next.size >= playerCount) {
        phaseRef.current = "restart";
        setPhase("restart");
      }
      return;
    }
    if (current === "go") {
      resolvedRef.current = true;
      playSlapSound();
      buzz(50);
      setWinnerIndex(index);
      phaseRef.current = "winner";
      setPhase("winner");
    }
  };

  const seats = splitSeats(players);
  const winner = winnerIndex !== null ? players[winnerIndex] : null;
  const cue =
    phase === "ready"
      ? "GET READY"
      : phase === "wait"
        ? "WAIT"
        : phase === "go"
          ? "SLAP!"
          : phase === "restart"
            ? "TOO SOON"
            : winner
              ? `${winner.name.toUpperCase()}!`
              : "NICE";

  const hint =
    phase === "ready"
      ? "Tablet in the middle. Hands on your pad."
      : phase === "wait"
        ? "Don't slap until it turns green."
        : phase === "go"
          ? "First pad wins."
          : phase === "restart"
            ? "Everyone jumped. Going again."
            : "Bragging rights only. Trivia scores stay put.";

  const renderPad = (
    index: number,
    player: TableSlapPlayer,
    side: "near" | "far"
  ) => {
    const jumped = falseStarts.has(index);
    const won = winnerIndex === index;
    const lost = winnerIndex !== null && winnerIndex !== index;
    return (
      <button
        key={`${side}-${index}`}
        type="button"
        className={`table-slap-pad${jumped ? " jumped" : ""}${won ? " won" : ""}${lost ? " lost" : ""}`}
        style={{ background: PAD_COLORS[index % PAD_COLORS.length] }}
        aria-label={`${player.name} slap pad`}
        onPointerDown={(event) => slap(index, event)}
        onContextMenu={(event) => event.preventDefault()}
      >
        <PlayerAvatar id={player.avatar} size={side === "far" ? 84 : 96} title={player.name} />
        <span className="table-slap-name">{player.name}</span>
        {jumped ? <span className="table-slap-flag">Too soon</span> : null}
        {won ? <span className="table-slap-flag">Winner</span> : null}
      </button>
    );
  };

  return (
    <div
      ref={rootRef}
      className={`table-slap-root ${phase}`}
      onPointerDown={phase === "winner" ? finish : undefined}
    >
      {seats.far.length ? (
        <div className="table-slap-row far" data-count={seats.far.length}>
          {seats.far.map(({ player, index }) => renderPad(index, player, "far"))}
        </div>
      ) : null}

      <div className="table-slap-center">
        <div className="table-slap-cue far-cue" aria-hidden>
          {cue}
        </div>
        <p className="table-slap-hint far-cue" aria-hidden>
          {hint}
        </p>
        <button
          type="button"
          className="table-slap-skip"
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            skip();
          }}
        >
          Skip mini-game
        </button>
        <div className="table-slap-cue" aria-live="polite">
          {cue}
        </div>
        <p className="table-slap-hint">{hint}</p>
      </div>

      <div className="table-slap-row near" data-count={seats.near.length}>
        {seats.near.map(({ player, index }) => renderPad(index, player, "near"))}
      </div>
    </div>
  );
}
