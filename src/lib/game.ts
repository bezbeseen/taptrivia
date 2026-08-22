import { FIGHTERS, MAX_STRIKES, TOTAL_ROUNDS, type Fighter } from "@/lib/fighters";

export type Grade = "perfect" | "sharp" | "clean" | "late" | "early" | "hit";
export type Phase =
  | "menu"
  | "records"
  | "intro"
  | "waiting"
  | "feint"
  | "live"
  | "resolving"
  | "over";

export type RoundResult = {
  fighterId: number;
  grade: Grade;
  reactionMs: number | null;
  points: number;
  combo: number;
};

export type RunSummary = {
  id: string;
  finishedAt: number;
  score: number;
  roundsCompleted: number;
  strikes: number;
  maxCombo: number;
  walkedTheCard: boolean;
  results: RoundResult[];
};

export const GRADE_COPY: Record<
  Grade,
  { label: string; line: string; points: number }
> = {
  perfect: { label: "Perfect", line: "Center of the palm. That's the one.", points: 1000 },
  sharp: { label: "Sharp", line: "Clean contact. Keep that tempo.", points: 720 },
  clean: { label: "Clean", line: "You got there. A little more snap.", points: 480 },
  late: { label: "Late", line: "You tagged them on the way out.", points: 180 },
  early: { label: "Early", line: "You jumped. That's a strike.", points: 0 },
  hit: { label: "Hit", line: "They got there first. That's a strike.", points: 0 },
};

export function getFighter(roundIndex: number): Fighter {
  return FIGHTERS[Math.min(roundIndex, FIGHTERS.length - 1)]!;
}

export function gradeReaction(fighter: Fighter, reactionMs: number): Grade {
  if (reactionMs <= fighter.perfectMs) return "perfect";
  if (reactionMs <= fighter.sharpMs) return "sharp";
  if (reactionMs <= fighter.cleanMs) return "clean";
  return "late";
}

export function isStrike(grade: Grade): boolean {
  return grade === "early" || grade === "hit";
}

export function scoreRound(grade: Grade, comboBefore: number): {
  points: number;
  comboAfter: number;
} {
  const base = GRADE_COPY[grade].points;
  if (base === 0) {
    return { points: 0, comboAfter: 0 };
  }
  const comboAfter = comboBefore + 1;
  const multiplier = Math.min(1 + Math.max(comboAfter - 1, 0) * 0.18, 2.5);
  return { points: Math.round(base * multiplier), comboAfter };
}

export function letterGrade(run: Pick<RunSummary, "score" | "walkedTheCard" | "strikes">): string {
  if (run.walkedTheCard && run.strikes === 0 && run.score >= 14000) return "S";
  if (run.walkedTheCard && run.score >= 11000) return "A";
  if (run.walkedTheCard) return "B";
  if (run.score >= 7000) return "C";
  if (run.score >= 3500) return "D";
  return "F";
}

export function makeRunId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function summarizeRun(input: {
  score: number;
  strikes: number;
  maxCombo: number;
  results: RoundResult[];
}): RunSummary {
  const walkedTheCard =
    input.results.length === TOTAL_ROUNDS && input.strikes < MAX_STRIKES;
  return {
    id: makeRunId(),
    finishedAt: Date.now(),
    score: input.score,
    roundsCompleted: input.results.length,
    strikes: input.strikes,
    maxCombo: input.maxCombo,
    walkedTheCard,
    results: input.results,
  };
}

export { MAX_STRIKES, TOTAL_ROUNDS };
