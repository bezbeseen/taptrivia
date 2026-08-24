import type { TapMode, TapState } from "@/tap-trivia/types";

export const RULES = {
  correctDelta: 1,
  wrongDelta: -1,
  minPlayers: 2,
  maxPlayers: 6,
  minWinScore: 1,
  maxWinScore: 99,
  defaultWinByPlayerCount: {
    2: 15,
    3: 11,
    4: 9,
    5: 8,
    6: 7,
  } as Record<number, number>,
  categoryMaxRun: 2,
  categoryMinGap: 50,
} as const;

export const DEFAULT_WIN_SCORE = RULES.defaultWinByPlayerCount;

export function defaultWinScore(playerCount: number): number {
  return DEFAULT_WIN_SCORE[playerCount] ?? 11;
}

export function clampPlayerCount(count: number): number {
  return Math.max(RULES.minPlayers, Math.min(RULES.maxPlayers, count));
}

export function clampWinScore(score: number): number {
  return Math.max(RULES.minWinScore, Math.min(RULES.maxWinScore, score || 1));
}

export function canPlayerScore(
  mode: TapMode,
  readerIndex: number,
  playerIndex: number
): boolean {
  if (mode === "host") return true;
  return playerIndex !== readerIndex;
}

export function hasWon(score: number, winTarget: number): boolean {
  return score >= winTarget;
}

export function nextReaderIndex(state: TapState, playerCount: number): number {
  if (!playerCount) return state.reader;
  return (state.reader + 1) % playerCount;
}

export const RULE_COPY = [
  `Correct: +${RULES.correctDelta}. Wrong: ${RULES.wrongDelta}.`,
  "All 12 categories rotate in.",
  `No category more than ${RULES.categoryMaxRun} times in a row.`,
  `Repeats from the same category stay at least ${RULES.categoryMinGap} questions apart in that category.`,
  "In reader rotation, the reader cannot score.",
].join(" ");
