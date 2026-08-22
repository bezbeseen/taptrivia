"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  cellOpenings,
  createPuzzle,
  flowing,
  isSolved,
  rotateCell,
  type Puzzle,
} from "@/lib/pipes";
import { PlayerAvatar } from "@/components/player-avatar";
import { playPuzzleWin, playRotateSound, playUiTap } from "@/lib/sounds";

export type SideQuestPlayer = {
  name: string;
  avatar: number;
};

function tableList(names: string[]) {
  if (names.length === 0) return "the table";
  if (names.length === 1) return names[0] ?? "the table";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

function PipeGlyph({
  open,
  wet,
  solved,
  empty,
}: {
  open: boolean[];
  wet: boolean;
  solved: boolean;
  empty: boolean;
}) {
  const color = solved ? "#86efac" : wet ? "#67e8f9" : "#a8a29e";
  if (empty) {
    return (
      <svg viewBox="0 0 64 64" aria-hidden>
        <circle cx="32" cy="32" r="3" fill="#44403c" />
      </svg>
    );
  }
  const segments = [
    open[0] ? "M32 32 L32 0" : "",
    open[1] ? "M32 32 L64 32" : "",
    open[2] ? "M32 32 L32 64" : "",
    open[3] ? "M32 32 L0 32" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <svg viewBox="0 0 64 64" aria-hidden>
      <path
        d={segments}
        fill="none"
        stroke={color}
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="32" r="8" fill={color} />
    </svg>
  );
}

export function SideQuest({
  players,
  onDone,
}: {
  players: SideQuestPlayer[];
  onDone: () => void;
}) {
  const [puzzle, setPuzzle] = useState<Puzzle>(() => createPuzzle());
  const [solved, setSolved] = useState(false);
  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone);

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
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") skip();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [skip]);

  useEffect(() => {
    if (!solved) return;
    const timer = window.setTimeout(() => finish(), 1500);
    return () => window.clearTimeout(timer);
  }, [finish, solved]);

  const wet = flowing(puzzle);
  const startY = Math.floor(puzzle.start / puzzle.cols);
  const endY = Math.floor(puzzle.end / puzzle.cols);

  const turn = (index: number) => {
    if (solved || doneRef.current) return;
    const cell = puzzle.cells[index];
    if (!cell || cell.shape === "none") return;
    playRotateSound();
    const next = rotateCell(puzzle, index);
    setPuzzle(next);
    if (isSolved(next)) {
      setSolved(true);
      playPuzzleWin();
    }
  };

  const names = players.map((player) => player.name);
  const crew = tableList(names);
  const huddle = solved
    ? `${crew} opened it. Trivia scores stay put.`
    : "Whole table, one puzzle. Anybody can turn a pipe — no points, just get IN to OUT.";
  const title = solved ? "Table win" : "Connect the pipes";

  return (
    <div className={`side-quest-root${solved ? " solved" : ""}`}>
      <button type="button" className="side-quest-skip" onClick={skip}>
        Skip puzzle
      </button>

      <div className="side-quest-copy far" aria-hidden>
        <div className="side-quest-kicker">Whole table</div>
        <p className="side-quest-hint">{huddle}</p>
      </div>

      <div className="side-quest-board">
        <div
          className="side-quest-rail"
          style={{ gridTemplateRows: `repeat(${puzzle.rows}, 1fr)` }}
        >
          {Array.from({ length: puzzle.rows }, (_, row) => (
            <div
              key={`in-${row}`}
              className={row === startY ? "side-quest-port in" : "side-quest-port"}
            >
              {row === startY ? "IN" : ""}
            </div>
          ))}
        </div>

        <div
          className="side-quest-grid"
          style={{
            gridTemplateColumns: `repeat(${puzzle.cols}, 1fr)`,
            gridTemplateRows: `repeat(${puzzle.rows}, 1fr)`,
          }}
        >
          {puzzle.cells.map((cell, index) => {
            const open = cellOpenings(cell);
            const empty = cell.shape === "none";
            const isWet = wet[index] ?? false;
            return (
              <button
                key={index}
                type="button"
                className={`side-quest-cell${isWet ? " wet" : ""}${solved ? " done" : ""}${empty ? " empty" : ""}`}
                disabled={solved || empty}
                aria-label={empty ? "Empty" : "Rotate pipe"}
                onClick={() => turn(index)}
              >
                <PipeGlyph open={open} wet={isWet} solved={solved} empty={empty} />
              </button>
            );
          })}
        </div>

        <div
          className="side-quest-rail"
          style={{ gridTemplateRows: `repeat(${puzzle.rows}, 1fr)` }}
        >
          {Array.from({ length: puzzle.rows }, (_, row) => (
            <div
              key={`out-${row}`}
              className={row === endY ? "side-quest-port out" : "side-quest-port"}
            >
              {row === endY ? "OUT" : ""}
            </div>
          ))}
        </div>
      </div>

      <div className="side-quest-crew" aria-label={`${crew} solving together`}>
        {players.map((player, index) => (
          <div className="side-quest-seat" key={`${player.name}-${index}`}>
            <PlayerAvatar id={player.avatar} size={44} title={player.name} />
            <span>{player.name}</span>
          </div>
        ))}
      </div>

      <div className="side-quest-copy near">
        <div className="side-quest-kicker">Whole table</div>
        <h1 className="side-quest-title">{title}</h1>
        <p className="side-quest-hint">{huddle}</p>
      </div>
    </div>
  );
}
