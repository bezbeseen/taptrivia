"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ALL_TYPES_ON,
  QUESTION_TYPES,
  clearSavedCsv,
  databaseSize,
  databaseSource,
  importCsvFile,
  initDatabase,
  loadTapQueue,
  questionTypeCounts,
} from "@/tap-trivia/database";
import {
  applyScoreDelta,
  emptyPlayState,
  nextQuestionTurn,
  revealAnswer,
  revealQuestion,
} from "@/tap-trivia/gameplay";
import {
  DEFAULT_WIN_SCORE,
  RULES,
  clampPlayerCount,
  clampWinScore,
  defaultWinScore,
} from "@/tap-trivia/rules";
import type {
  TapDifficulty,
  TapMode,
  TapQuestion,
  TapQuestionType,
  TapState,
  TypeFilter,
} from "@/tap-trivia/types";
import { playCorrect, playWinner, playWrong } from "@/tap-trivia/ui/sounds";

const DEFAULT_NAMES = ["Bez", "Sean", "Marc", "Player 4", "Player 5", "Player 6"];

export function useTapTrivia() {
  const [setup, setSetup] = useState(true);
  const [difficulty, setDifficulty] = useState<TapDifficulty | "">("");
  const [mode, setMode] = useState<TapMode>("rotation");
  const [playerCount, setPlayerCount] = useState(3);
  const [winTarget, setWinTarget] = useState(defaultWinScore(3));
  const [hostName, setHostName] = useState("Host");
  const [draftNames, setDraftNames] = useState(() => DEFAULT_NAMES.slice());
  const [names, setNames] = useState<string[]>([]);
  const [queue, setQueue] = useState<TapQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [state, setState] = useState<TapState>(emptyPlayState());
  const [history, setHistory] = useState<string[]>([]);
  const [status, setStatus] = useState("Choose settings and press Let's play.");
  const [loading, setLoading] = useState(false);
  const [dbCount, setDbCount] = useState(0);
  const [dbSource, setDbSource] = useState("bundled library");
  const [typeCounts, setTypeCounts] = useState<Record<TapQuestionType, number>>({
    open: 0,
    boolean: 0,
    multiple: 0,
  });
  const [types, setTypes] = useState<TypeFilter>(ALL_TYPES_ON);
  const [importing, setImporting] = useState(false);

  const refreshDatabaseMeta = () => {
    setDbCount(databaseSize());
    setDbSource(databaseSource());
    setTypeCounts(questionTypeCounts());
  };

  useEffect(() => {
    void initDatabase((message) => setStatus(message))
      .then(() => {
        refreshDatabaseMeta();
        setStatus(`${databaseSize().toLocaleString()} questions ready from the ${databaseSource()}.`);
      })
      .catch((error: unknown) => {
        setStatus(error instanceof Error ? error.message : "Could not load questions.");
      });
  }, []);

  const currentQuestion = queue[index] ?? null;

  const snapshot = (from: TapState) => {
    setHistory((prev) => {
      const next = [...prev, JSON.stringify({ state: from, index })];
      return next.length > 100 ? next.slice(-100) : next;
    });
  };

  const setPlayerCountSafe = (count: number) => {
    const next = clampPlayerCount(count);
    setPlayerCount(next);
    setWinTarget(defaultWinScore(next));
  };

  const setDraftName = (playerIndex: number, value: string) => {
    setDraftNames((prev) => prev.map((name, i) => (i === playerIndex ? value : name)));
  };

  const toggleType = (key: TapQuestionType) => {
    setTypes((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (!QUESTION_TYPES.some((item) => next[item.id])) return prev;
      return next;
    });
  };

  const importDatabase = async (file: File) => {
    setImporting(true);
    try {
      const count = await importCsvFile(file, (message) => setStatus(message));
      refreshDatabaseMeta();
      setDbSource(file.name);
      setStatus(`${count.toLocaleString()} questions are ready and saved on this browser.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not import that file.");
    } finally {
      setImporting(false);
    }
  };

  const useBundledLibrary = async () => {
    setImporting(true);
    try {
      await clearSavedCsv();
      refreshDatabaseMeta();
      setStatus(
        `${databaseSize().toLocaleString()} bundled questions ready. Upload a CSV anytime to switch.`
      );
    } finally {
      setImporting(false);
    }
  };

  const startGame = async () => {
    setLoading(true);
    try {
      const nextQueue = await loadTapQueue({
        difficulty,
        types,
        onStatus: (message) => setStatus(message),
      });
      const count = playerCount;
      const nextNames = Array.from({ length: count }, (_, i) => {
        const value = draftNames[i]?.trim();
        return value || `Player ${i + 1}`;
      });
      const target = clampWinScore(winTarget || defaultWinScore(count));
      setQueue(nextQueue);
      setIndex(0);
      setNames(nextNames);
      setWinTarget(target);
      setState(emptyPlayState(count));
      setHistory([]);
      setSetup(false);
      setStatus(
        `${mode === "host" ? `${hostName.trim() || "Host"} is hosting.` : `${nextNames[0]} reads first.`} ${nextQueue.length.toLocaleString()} questions ready across all categories.`
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not start the game.");
    } finally {
      setLoading(false);
    }
  };

  const showQuestion = () => {
    if (!currentQuestion || state.winner !== null) return;
    setState((prev) => revealQuestion(prev));
  };

  const showAnswer = () => {
    if (!currentQuestion || !state.questionVisible || state.winner !== null) return;
    setState((prev) => revealAnswer(prev));
  };

  const markScore = (playerIndex: number, delta: 1 | -1) => {
    if (state.winner !== null) return;
    snapshot(state);
    const result = applyScoreDelta({
      state,
      mode,
      playerIndex,
      delta,
      winTarget,
      index,
      lastIndex: Math.max(0, queue.length - 1),
    });
    if (!result.accepted) return;
    if (result.won) playWinner();
    else if (delta > 0) playCorrect();
    else playWrong();
    setIndex(result.index);
    setState(result.state);
    setStatus(
      `${names[playerIndex]} ${
        delta > 0 ? "answered correctly: +1 point." : "answered incorrectly: −1 point."
      }`
    );
  };

  const nextReader = () => {
    if (!queue.length || state.winner !== null) return;
    snapshot(state);
    const next = nextQuestionTurn({
      state,
      mode,
      playerCount: names.length,
      index,
      lastIndex: Math.max(0, queue.length - 1),
    });
    setIndex(next.index);
    setState(next.state);
    setStatus(
      mode === "host"
        ? `${hostName.trim() || "Host"} asks the next question.`
        : `${names[next.state.reader]} reads next.`
    );
  };

  const undo = () => {
    if (!history.length) return;
    const previous = history[history.length - 1];
    if (!previous) return;
    const parsed = JSON.parse(previous) as { state: TapState; index: number };
    setHistory((prev) => prev.slice(0, -1));
    setState(parsed.state);
    setIndex(parsed.index);
    setStatus("Last score change undone. Question position unchanged.");
  };

  const resetGame = () => {
    setSetup(true);
    setQueue([]);
    setIndex(0);
    setNames([]);
    setState(emptyPlayState());
    setHistory([]);
    setStatus(
      dbCount
        ? `${dbCount.toLocaleString()} questions ready from the ${dbSource}.`
        : "Choose settings and press Let's play."
    );
  };

  const readerName =
    mode === "host" ? hostName.trim() || "Host" : names[state.reader] ?? "";
  const nextName =
    mode === "rotation" && names.length
      ? names[(state.reader + 1) % names.length] ?? ""
      : "";

  const subtitle = useMemo(() => {
    if (setup) return "Powered by the Tap Trivia Question Database";
    return `First to ${winTarget} points wins`;
  }, [setup, winTarget]);

  return {
    setup,
    difficulty,
    setDifficulty,
    mode,
    setMode,
    playerCount,
    setPlayerCountSafe,
    winTarget,
    setWinTarget,
    hostName,
    setHostName,
    draftNames,
    setDraftName,
    names,
    currentQuestion,
    state,
    status,
    loading,
    importing,
    dbCount,
    dbSource,
    typeCounts,
    types,
    toggleType,
    subtitle,
    readerName,
    nextName,
    historyLength: history.length,
    importDatabase,
    useBundledLibrary,
    startGame,
    showQuestion,
    showAnswer,
    markScore,
    nextReader,
    undo,
    resetGame,
    minPlayers: RULES.minPlayers,
    maxPlayers: RULES.maxPlayers,
    defaultWinByCount: DEFAULT_WIN_SCORE,
    ruleCopy: RULES,
  };
}

export type TapTriviaGame = ReturnType<typeof useTapTrivia>;
