"use client";

import { useCallback, useMemo, useState } from "react";
import {
  EMPTY_INDEXES,
  loadQuestionIndexes,
  saveQuestionIndexes,
  type QuestionIndexes,
} from "@/lib/question-progress";
import {
  LEVELS,
  levelLabel,
  loadQuestionBanks,
  type Level,
  type TriviaQuestion,
} from "@/lib/questions";
import { playCorrectSound, playWrongSound, ringAlarm } from "@/lib/sounds";

export type GameState = {
  scores: number[];
  misses: number[];
  reader: number;
  winner: { index: number } | null;
  questionVisible: boolean;
  answerVisible: boolean;
};

const DEFAULT_NAMES = ["Bez", "Sean", "Marc"];

function emptyState(count = 0): GameState {
  return {
    scores: Array(count).fill(0),
    misses: Array(count).fill(0),
    reader: 0,
    winner: null,
    questionVisible: false,
    answerVisible: false,
  };
}

export function useSlapTrivia() {
  const [setup, setSetup] = useState(true);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [level, setLevel] = useState<Level | "">("");
  const [playerCount, setPlayerCount] = useState(3);
  const [winTarget, setWinTarget] = useState(15);
  const [draftNames, setDraftNames] = useState(() =>
    Array.from({ length: 8 }, (_, i) => DEFAULT_NAMES[i] ?? "")
  );
  const [names, setNames] = useState<string[]>([]);
  const [activeLevel, setActiveLevel] = useState<Level | null>(null);
  const [pool, setPool] = useState<TriviaQuestion[]>([]);
  const [indexes, setIndexes] = useState<QuestionIndexes>(EMPTY_INDEXES);
  const [state, setState] = useState<GameState>(emptyState());
  const [history, setHistory] = useState<string[]>([]);
  const [status, setStatus] = useState("Set up the game to begin.");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const questionIndex = activeLevel ? indexes[activeLevel] : 0;
  const currentQuestion = pool[questionIndex] ?? null;

  const snapshot = useCallback(() => {
    setHistory((prev) => {
      const next = [...prev, JSON.stringify(state)];
      return next.length > 100 ? next.slice(-100) : next;
    });
  }, [state]);

  const setPlayerCountSafe = (count: number) => {
    setPlayerCount(Math.max(3, Math.min(8, count)));
  };

  const setDraftName = (index: number, value: string) => {
    setDraftNames((prev) => prev.map((name, i) => (i === index ? value : name)));
  };

  const advanceQuestion = useCallback(
    (from: GameState, nextIndexes: QuestionIndexes) => {
      if (!activeLevel) {
        return {
          nextState: { ...from, questionVisible: false, answerVisible: false },
          nextIndexes,
        };
      }
      const updated = { ...nextIndexes };
      if (questionIndex < pool.length - 1) {
        updated[activeLevel] = questionIndex + 1;
      }
      saveQuestionIndexes(updated);
      return {
        nextState: { ...from, questionVisible: false, answerVisible: false },
        nextIndexes: updated,
      };
    },
    [activeLevel, pool.length, questionIndex]
  );

  const startGame = () => {
    if (!level) {
      setStatus("Choose a question level first.");
      return;
    }
    setLoading(true);
    setLoadError(null);
    setStatus(`Loading ${levelLabel(level)} questions...`);
    try {
      const banks = loadQuestionBanks();
      const stored = loadQuestionIndexes();
      const nextPool = banks[level];
      const count = playerCount;
      const nextNames = Array.from({ length: count }, (_, i) => {
        const value = draftNames[i]?.trim();
        return value || `Player ${i + 1}`;
      });
      const target = Math.max(1, Math.min(99, winTarget || 15));
      const startIndex = Math.min(stored[level] || 0, Math.max(nextPool.length - 1, 0));
      setIndexes({ ...stored, [level]: startIndex });
      setNames(nextNames);
      setWinTarget(target);
      setActiveLevel(level);
      setPool(nextPool);
      setState(emptyState(count));
      setHistory([]);
      setSetup(false);
      setConfirmOpen(false);
      setStatus(`${nextNames[0]} reads first.`);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not load questions.");
      setStatus("Could not load questions.");
    } finally {
      setLoading(false);
    }
  };

  const showQuestion = () => {
    if (!currentQuestion) return;
    if (state.answerVisible) {
      ringAlarm();
      setConfirmOpen(true);
      return;
    }
    setState((prev) => ({ ...prev, questionVisible: true, answerVisible: false }));
  };

  const confirmShowQuestion = () => {
    setConfirmOpen(false);
    setState((prev) => ({ ...prev, questionVisible: true, answerVisible: false }));
  };

  const showAnswer = () => {
    if (!currentQuestion || !state.questionVisible) return;
    setState((prev) => ({ ...prev, answerVisible: true }));
  };

  const markCorrect = (index: number) => {
    if (index === state.reader || state.winner) return;
    snapshot();
    playCorrectSound();
    const scores = [...state.scores];
    scores[index] = (scores[index] ?? 0) + 1;
    let next: GameState = { ...state, scores };
    const advanced = advanceQuestion(next, indexes);
    next = advanced.nextState;
    setIndexes(advanced.nextIndexes);
    if ((scores[index] ?? 0) >= winTarget) {
      next = { ...next, winner: { index } };
    }
    setState(next);
    setConfirmOpen(false);
    setStatus(`${names[index]} answered correctly: +1 point.`);
  };

  const markWrong = (index: number) => {
    if (index === state.reader || state.winner) return;
    snapshot();
    playWrongSound();
    const misses = [...state.misses];
    const scores = [...state.scores];
    misses[index] = (misses[index] ?? 0) + 1;
    const penalty = misses[index] ?? 1;
    scores[index] = (scores[index] ?? 0) - penalty;
    setState({ ...state, misses, scores });
    setStatus(
      `${names[index]} was wrong: -${penalty}. Any other non-reader may answer next.`
    );
  };

  const nextReader = () => {
    if (state.winner || !activeLevel || !names.length) return;
    snapshot();
    const advanced = advanceQuestion(state, indexes);
    setIndexes(advanced.nextIndexes);
    const reader = (state.reader + 1) % names.length;
    setState({ ...advanced.nextState, reader });
    setConfirmOpen(false);
    setStatus(`${names[reader]} reads. Everyone else may compete.`);
  };

  const undo = () => {
    if (!history.length) return;
    const previous = history[history.length - 1];
    if (!previous) return;
    setHistory((prev) => prev.slice(0, -1));
    setState(JSON.parse(previous) as GameState);
    setConfirmOpen(false);
    setStatus("Last scoring action undone. Question position is unchanged.");
  };

  const resetGame = () => {
    setHistory([]);
    setState(emptyState());
    setConfirmOpen(false);
    setActiveLevel(null);
    setPool([]);
    setNames([]);
    setSetup(true);
    setStatus("New game. Question progress is preserved by level.");
  };

  const subtitle = useMemo(() => {
    if (setup || !activeLevel) return "Trivia showdown";
    return `First to ${winTarget} net points wins`;
  }, [activeLevel, setup, winTarget]);

  const readerName = names[state.reader] ?? "";

  return {
    setup,
    rulesOpen,
    setRulesOpen,
    confirmOpen,
    setConfirmOpen,
    level,
    setLevel,
    playerCount,
    setPlayerCountSafe,
    winTarget,
    setWinTarget,
    draftNames,
    setDraftName,
    names,
    activeLevel,
    currentQuestion,
    questionIndex,
    poolSize: pool.length,
    state,
    status,
    loadError,
    loading,
    subtitle,
    readerName,
    historyLength: history.length,
    levels: LEVELS,
    startGame,
    showQuestion,
    confirmShowQuestion,
    showAnswer,
    markCorrect,
    markWrong,
    nextReader,
    undo,
    resetGame,
  };
}
