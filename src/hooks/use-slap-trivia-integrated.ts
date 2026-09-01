"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSlapTrivia as useBaseSlapTrivia } from "./use-slap-trivia";

type MiniPlayer = {
  index: number;
  name: string;
  avatar: string;
  score: number;
};

type MiniGameApi = {
  getPlayers: () => MiniPlayer[];
  getLastScorerIndex: () => number;
  getFirstPlaceStarterIndex: () => number;
  addPoints: (index: number, points: number) => void;
  setScore: (index: number, value: number) => void;
  getLeaderScore: () => number;
  getLastPlaceIndexes: () => number[];
};

declare global {
  interface Window {
    __tapMiniGameAPI?: MiniGameApi;
    __launchTapMiniGame?: () => void;
  }
}

export function useSlapTrivia() {
  const base = useBaseSlapTrivia();
  const [miniAdjustments, setMiniAdjustments] = useState<number[]>([]);
  const lastScorerRef = useRef<number | null>(null);
  const firstPlaceRef = useRef<number | null>(null);
  const completedQuestionsRef = useRef(0);

  const derivedScores = useMemo(
    () =>
      base.state.scores.map(
        (score, index) => (score ?? 0) + (miniAdjustments[index] ?? 0)
      ),
    [base.state.scores, miniAdjustments]
  );

  const overallWinnerIndex = derivedScores.findIndex(
    (score) => score >= base.winTarget
  );
  const derivedWinner =
    base.state.winner ??
    (overallWinnerIndex >= 0 ? { index: overallWinnerIndex } : null);

  const state = useMemo(
    () => ({ ...base.state, scores: derivedScores, winner: derivedWinner }),
    [base.state, derivedScores, derivedWinner]
  );

  const roundResult = useMemo(() => {
    const result = base.roundResult;
    if (!result || result.playerIndex === null) return result;
    const score = derivedScores[result.playerIndex] ?? result.score;
    const won = score >= base.winTarget;
    return {
      ...result,
      score,
      won,
      continueLabel: won ? "New game" : result.continueLabel,
    };
  }, [base.roundResult, base.winTarget, derivedScores]);

  useEffect(() => {
    if (!derivedScores.length) {
      firstPlaceRef.current = null;
      return;
    }
    const high = Math.max(...derivedScores);
    const leaders = derivedScores
      .map((score, index) => (score === high ? index : -1))
      .filter((index) => index >= 0);
    if (leaders.length === 1) {
      firstPlaceRef.current = leaders[0];
    } else if (
      firstPlaceRef.current === null ||
      !leaders.includes(firstPlaceRef.current)
    ) {
      firstPlaceRef.current = leaders[0] ?? 0;
    }
  }, [derivedScores]);

  const addMiniPoints = (index: number, points: number) => {
    if (!Number.isFinite(points) || index < 0 || index >= base.names.length) return;
    setMiniAdjustments((previous) => {
      const next = Array.from(
        { length: base.names.length },
        (_, i) => previous[i] ?? 0
      );
      next[index] = (next[index] ?? 0) + points;
      return next;
    });
    if (points > 0) lastScorerRef.current = index;
  };

  const setMiniScore = (index: number, value: number) => {
    if (!Number.isFinite(value) || index < 0 || index >= base.names.length) return;
    setMiniAdjustments((previous) => {
      const next = Array.from(
        { length: base.names.length },
        (_, i) => previous[i] ?? 0
      );
      next[index] = value - (base.state.scores[index] ?? 0);
      return next;
    });
    if (value > (derivedScores[index] ?? 0)) lastScorerRef.current = index;
  };

  const miniApi = useMemo<MiniGameApi>(
    () => ({
      getPlayers: () =>
        base.names.map((name, index) => ({
          index,
          name,
          avatar: "",
          score: derivedScores[index] ?? 0,
        })),
      getLastScorerIndex: () => lastScorerRef.current ?? 0,
      getFirstPlaceStarterIndex: () => firstPlaceRef.current ?? 0,
      addPoints: addMiniPoints,
      setScore: setMiniScore,
      getLeaderScore: () =>
        derivedScores.length ? Math.max(...derivedScores) : 0,
      getLastPlaceIndexes: () => {
        if (!derivedScores.length) return [];
        const low = Math.min(...derivedScores);
        return derivedScores
          .map((score, index) => (score === low ? index : -1))
          .filter((index) => index >= 0);
      },
    }),
    [base.names, base.state.scores, derivedScores]
  );

  useEffect(() => {
    window.__tapMiniGameAPI = miniApi;
    return () => {
      if (window.__tapMiniGameAPI === miniApi) delete window.__tapMiniGameAPI;
    };
  }, [miniApi]);

  const markCorrect = (index: number) => {
    lastScorerRef.current = index;
    base.markCorrect(index);
  };

  const dismissRoundResult = () => {
    const result = base.roundResult;
    base.dismissRoundResult();
    if (!result || result.kind !== "correct" || result.won) return;

    completedQuestionsRef.current += 1;
    if (completedQuestionsRef.current % 3 === 0) {
      window.setTimeout(() => window.__launchTapMiniGame?.(), 250);
    }
  };

  const startGame = () => {
    setMiniAdjustments([]);
    lastScorerRef.current = null;
    firstPlaceRef.current = null;
    completedQuestionsRef.current = 0;
    base.startGame();
  };

  const resetGame = () => {
    setMiniAdjustments([]);
    lastScorerRef.current = null;
    firstPlaceRef.current = null;
    completedQuestionsRef.current = 0;
    base.resetGame();
  };

  return {
    ...base,
    state,
    roundResult,
    markCorrect,
    dismissRoundResult,
    startGame,
    resetGame,
  };
}
