"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { playChompSound, playGulpSound, playPuzzleWin, playUiTap } from "@/lib/sounds";

export type HippoPlayer = {
  name: string;
  avatar: number;
};

type Side = "n" | "e" | "s" | "w";
type Phase = "ready" | "play" | "over";

type Marble = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alive: boolean;
  fill: string;
};

const HIPPO_COLORS = [
  "#ff5d8f",
  "#3ddc97",
  "#5ec8ff",
  "#ffd23f",
  "#c084fc",
  "#fb923c",
  "#86efac",
  "#f472b6",
];

const MARBLE_FILL = ["#fff7ed", "#ffe066", "#ff8fab", "#74c0fc", "#b197fc", "#63e6be"];
const TARGET = 5;
const MARBLE_COUNT = 14;
const CHOMP_MS = 170;

function seatSides(count: number): Side[] {
  const layouts: Record<number, Side[]> = {
    3: ["s", "w", "e"],
    4: ["s", "w", "n", "e"],
    5: ["s", "w", "n", "e", "s"],
    6: ["s", "w", "n", "e", "s", "n"],
    7: ["s", "w", "n", "e", "s", "n", "w"],
    8: ["s", "w", "n", "e", "s", "n", "w", "e"],
  };
  return layouts[count] ?? ["s", "w", "n", "e"];
}

function HippoGlyph({ color, open }: { color: string; open: boolean }) {
  return (
    <svg viewBox="0 0 88 88" aria-hidden>
      <ellipse cx="44" cy="52" rx="30" ry="24" fill={color} stroke="#1b1233" strokeWidth="3.5" />
      <ellipse cx="24" cy="38" rx="9" ry="12" fill={color} stroke="#1b1233" strokeWidth="3" />
      <ellipse cx="64" cy="38" rx="9" ry="12" fill={color} stroke="#1b1233" strokeWidth="3" />
      <circle cx="24" cy="36" r="3.2" fill="#1b1233" />
      <circle cx="64" cy="36" r="3.2" fill="#1b1233" />
      <ellipse cx="44" cy={open ? 28 : 34} rx="16" ry={open ? 12 : 7} fill="#4a1942" stroke="#1b1233" strokeWidth="3" />
      {open ? <ellipse cx="44" cy="26" rx="10" ry="5" fill="#ff8fab" /> : null}
      <circle cx="34" cy="50" r="3" fill="#1b1233" opacity="0.35" />
      <circle cx="54" cy="50" r="3" fill="#1b1233" opacity="0.35" />
    </svg>
  );
}

export function HungryHippos({
  players,
  onDone,
}: {
  players: HippoPlayer[];
  onDone: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("ready");
  const [scores, setScores] = useState(() => players.map(() => 0));
  const [chomp, setChomp] = useState(() => players.map(() => false));
  const [winner, setWinner] = useState<number | null>(null);
  const feltRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hippoRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const marblesRef = useRef<Marble[]>([]);
  const chompUntilRef = useRef<number[]>(players.map(() => 0));
  const scoresRef = useRef<number[]>(players.map(() => 0));
  const phaseRef = useRef<Phase>("ready");
  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone);
  const sides = useMemo(() => seatSides(players.length), [players.length]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

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
    if (phase !== "ready") return;
    const timer = window.setTimeout(() => setPhase("play"), 1800);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "over") return;
    playPuzzleWin();
    const timer = window.setTimeout(() => finish(), 2000);
    return () => window.clearTimeout(timer);
  }, [finish, phase]);

  useEffect(() => {
    if (phase !== "play") return;
    const canvas = canvasRef.current;
    const felt = feltRef.current;
    if (!canvas || !felt) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = felt.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const width = felt.clientWidth;
      const height = felt.clientHeight;
      if (marblesRef.current.length === 0 && width > 40 && height > 40) {
        marblesRef.current = Array.from({ length: MARBLE_COUNT }, (_, i) => {
          const angle = Math.random() * Math.PI * 2;
          const speed = 1.6 + Math.random() * 2.2;
          return {
            x: width * (0.28 + Math.random() * 0.44),
            y: height * (0.28 + Math.random() * 0.44),
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            r: 11 + Math.random() * 4,
            alive: true,
            fill: MARBLE_FILL[i % MARBLE_FILL.length]!,
          };
        });
      }
    };
    marblesRef.current = [];
    resize();

    let raf = 0;
    let last = performance.now();
    let ended = false;

    const mouth = (index: number, side: Side) => {
      const hippo = hippoRefs.current[index];
      if (!hippo) return null;
      const hr = hippo.getBoundingClientRect();
      const cr = canvas.getBoundingClientRect();
      const depth = 70;
      if (side === "s") {
        return {
          x: hr.left - cr.left,
          y: cr.height - depth,
          w: hr.width,
          h: depth,
        };
      }
      if (side === "n") {
        return { x: hr.left - cr.left, y: 0, w: hr.width, h: depth };
      }
      if (side === "w") {
        return { x: 0, y: hr.top - cr.top, w: depth, h: hr.height };
      }
      return { x: cr.width - depth, y: hr.top - cr.top, w: depth, h: hr.height };
    };

    const endGame = (winnerIndex: number) => {
      if (ended) return;
      ended = true;
      setWinner(winnerIndex);
      setPhase("over");
    };

    const step = (now: number) => {
      const dt = Math.min(32, now - last) / 16.67;
      last = now;
      const width = felt.clientWidth;
      const height = felt.clientHeight;
      const balls = marblesRef.current;
      const pad = 8;

      for (const ball of balls) {
        if (!ball.alive) continue;
        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;
        if (ball.x < pad + ball.r) {
          ball.x = pad + ball.r;
          ball.vx = Math.abs(ball.vx);
        }
        if (ball.x > width - pad - ball.r) {
          ball.x = width - pad - ball.r;
          ball.vx = -Math.abs(ball.vx);
        }
        if (ball.y < pad + ball.r) {
          ball.y = pad + ball.r;
          ball.vy = Math.abs(ball.vy);
        }
        if (ball.y > height - pad - ball.r) {
          ball.y = height - pad - ball.r;
          ball.vy = -Math.abs(ball.vy);
        }
      }

      for (let i = 0; i < balls.length; i++) {
        const a = balls[i];
        if (!a?.alive) continue;
        for (let j = i + 1; j < balls.length; j++) {
          const b = balls[j];
          if (!b?.alive) continue;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.hypot(dx, dy) || 0.001;
          const min = a.r + b.r;
          if (dist >= min) continue;
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = min - dist;
          a.x -= nx * overlap * 0.5;
          a.y -= ny * overlap * 0.5;
          b.x += nx * overlap * 0.5;
          b.y += ny * overlap * 0.5;
          const dv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (dv > 0) continue;
          a.vx += nx * dv;
          a.vy += ny * dv;
          b.vx -= nx * dv;
          b.vy -= ny * dv;
        }
      }

      if (phaseRef.current === "play") {
        players.forEach((_, index) => {
          if (chompUntilRef.current[index]) {
            const box = mouth(index, sides[index] ?? "s");
            if (!box) return;
            for (const ball of balls) {
              if (!ball.alive) continue;
              const closestX = Math.max(box.x, Math.min(ball.x, box.x + box.w));
              const closestY = Math.max(box.y, Math.min(ball.y, box.y + box.h));
              if ((ball.x - closestX) ** 2 + (ball.y - closestY) ** 2 > ball.r * ball.r) {
                continue;
              }
              ball.alive = false;
              playGulpSound();
              const nextScores = [...scoresRef.current];
              nextScores[index] = (nextScores[index] ?? 0) + 1;
              scoresRef.current = nextScores;
              setScores(nextScores);
              if ((nextScores[index] ?? 0) >= TARGET) {
                endGame(index);
                return;
              }
            }
          }
        });
        if (balls.every((ball) => !ball.alive)) {
          let best = 0;
          scoresRef.current.forEach((value, index) => {
            if (value > (scoresRef.current[best] ?? 0)) best = index;
          });
          endGame(best);
        }
      }

      ctx.clearRect(0, 0, width, height);
      for (const ball of balls) {
        if (!ball.alive) continue;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
        ctx.fillStyle = ball.fill;
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#1b1233";
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(ball.x - 3, ball.y - 3, ball.r * 0.28, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.fill();
      }
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    const observer = new ResizeObserver(resize);
    observer.observe(felt);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [phase, players, sides]);

  const mash = (index: number) => {
    if (phase === "over" || doneRef.current) return;
    if (chompUntilRef.current[index]) return;
    chompUntilRef.current[index] = 1;
    playChompSound();
    setChomp((prev) => prev.map((on, i) => (i === index ? true : on)));
    window.setTimeout(() => {
      chompUntilRef.current[index] = 0;
      setChomp((prev) => prev.map((on, i) => (i === index ? false : on)));
    }, CHOMP_MS);
  };

  const groups: Record<Side, { player: HippoPlayer; index: number }[]> = {
    n: [],
    e: [],
    s: [],
    w: [],
  };
  players.forEach((player, index) => {
    groups[sides[index] ?? "s"]!.push({ player, index });
  });

  const renderHippo = (index: number, player: HippoPlayer, side: Side) => (
    <button
      key={`${side}-${index}`}
      type="button"
      ref={(node) => {
        hippoRefs.current[index] = node;
      }}
      className={`hippo${chomp[index] ? " chomp" : ""}`}
      data-side={side}
      aria-label={`${player.name} hippo`}
      onPointerDown={(event) => {
        event.preventDefault();
        mash(index);
      }}
    >
      <span className="hippo-inner">
        <HippoGlyph color={HIPPO_COLORS[index % HIPPO_COLORS.length]!} open={!!chomp[index]} />
        <span className="hippo-name">{player.name}</span>
        <span className="hippo-score">{scores[index] ?? 0}</span>
      </span>
    </button>
  );

  const champ = winner !== null ? players[winner] : null;

  return (
    <div className={`hippos-root ${phase}`}>
      <div className="hippos-row n">{groups.n.map(({ player, index }) => renderHippo(index, player, "n"))}</div>
      <div className="hippos-mid">
        <div className="hippos-col w">{groups.w.map(({ player, index }) => renderHippo(index, player, "w"))}</div>
        <div className="hippos-felt" ref={feltRef}>
          <canvas ref={canvasRef} className="hippos-canvas" />
          {phase === "ready" ? (
            <div className="hippos-banner">
              <div className="hippos-kicker">Side quest</div>
              <h1>Hungry Hungry Hippos</h1>
              <p>Mash the hippo facing you. First to {TARGET} marbles. Trivia scores stay put.</p>
            </div>
          ) : null}
          {phase === "over" && champ ? (
            <div className="hippos-banner win" onPointerDown={finish} role="button" tabIndex={0}>
              <div className="hippos-kicker">Winner</div>
              <h1>{champ.name}</h1>
              <p>Ate {scores[winner!] ?? TARGET} marbles. Not a trivia point.</p>
            </div>
          ) : null}
          <button type="button" className="hippos-skip" onClick={skip}>
            Skip
          </button>
        </div>
        <div className="hippos-col e">{groups.e.map(({ player, index }) => renderHippo(index, player, "e"))}</div>
      </div>
      <div className="hippos-row s">{groups.s.map(({ player, index }) => renderHippo(index, player, "s"))}</div>
    </div>
  );
}
