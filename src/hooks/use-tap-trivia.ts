"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  playContinueSound,
  playCorrectSound,
  playMultipleChoiceSound,
  playNextReaderSound,
  playNopeSound,
  playShowAnswerSound,
  playShowQuestionSound,
  playStartSound,
  playUndoSound,
  playWinSound,
  playWrongSound,
} from "@/lib/sounds";
import {
  ALL_TYPES_ON,
  QUESTION_TYPES,
  buildPlayableChoices,
  currentBank,
  databaseSize,
  databaseSource,
  importCsvFile,
  initDatabase,
  loadTapQueue,
  questionTypeCounts,
  selectBank,
} from "@/tap-trivia/database";
import {
  applyScore,
  eliminateChoice,
  emptyPlayState,
  enableNobodyKnows,
  nextQuestionTurn,
  revealAnswer,
  revealQuestion,
} from "@/tap-trivia/gameplay";
import {
  DEFAULT_WIN_SCORE,
  RULES,
  canShowNobodyKnows,
  clampPlayerCount,
  clampWinScore,
  defaultWinScore,
  showsChoices,
} from "@/tap-trivia/rules";
import type {
  BankId,
  TapDifficulty,
  TapMode,
  TapQuestion,
  TapQuestionType,
  TapRoundResult,
  TapState,
  TypeFilter,
} from "@/tap-trivia/types";

const DEFAULT_NAMES = ["Bez", "Sean", "Marc", "Player 4", "Player 5", "Player 6"];

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
  const [dbSource, setDbSource] = useState("this build");
  const [bank, setBank] = useState<BankId>("table");
  const [typeCounts, setTypeCounts] = useState<Record<TapQuestionType, number>>({
    open: 0,
    boolean: 0,
    multiple: 0,
  });
  const [types, setTypes] = useState<TypeFilter>(ALL_TYPES_ON);
  const [importing, setImporting] = useState(false);
  const [roundResult, setRoundResult] = useState<TapRoundResult | null>(null);
  const [miniAdjustments, setMiniAdjustments] = useState<number[]>([]);
  const lastScorerRef = useRef<number | null>(null);
  const firstPlaceRef = useRef<number | null>(null);
  const completedQuestionsRef = useRef(0);

  const derivedScores = useMemo(
    () =>
      state.scores.map(
        (score, playerIndex) => (score ?? 0) + (miniAdjustments[playerIndex] ?? 0)
      ),
    [miniAdjustments, state.scores]
  );

  const overallWinnerIndex = derivedScores.findIndex((score) => score >= winTarget);
  const playState = useMemo(
    () => ({
      ...state,
      scores: derivedScores,
      winner:
        state.winner ??
        (overallWinnerIndex >= 0 ? overallWinnerIndex : null),
    }),
    [derivedScores, overallWinnerIndex, state]
  );

  const refreshDatabaseMeta = () => {
    setDbCount(databaseSize());
    setDbSource(databaseSource());
    setBank(currentBank());
    setTypeCounts(questionTypeCounts());
  };

  useEffect(() => {
    void initDatabase((message) => setStatus(message))
      .then(() => {
        refreshDatabaseMeta();
        setStatus(`${databaseSize().toLocaleString()} questions ready from ${databaseSource()}.`);
      })
      .catch((error: unknown) => {
        setStatus(error instanceof Error ? error.message : "Could not load questions.");
      });
  }, []);

  const currentQuestion = queue[index] ?? null;
  const choices = useMemo(() => {
    if (!currentQuestion) return [];
    return buildPlayableChoices(currentQuestion, queue, playState.nobodyKnows);
  }, [currentQuestion, playState.nobodyKnows, queue]);

  const addMiniPoints = (playerIndex: number, points: number) => {
    if (!Number.isFinite(points) || playerIndex < 0 || playerIndex >= names.length) return;
    setMiniAdjustments((previous) => {
      const next = Array.from({ length: names.length }, (_, i) => previous[i] ?? 0);
      next[playerIndex] = (next[playerIndex] ?? 0) + points;
      return next;
    });
    if (points > 0) lastScorerRef.current = playerIndex;
  };

  const setMiniScore = (playerIndex: number, value: number) => {
    if (!Number.isFinite(value) || playerIndex < 0 || playerIndex >= names.length) return;
    setMiniAdjustments((previous) => {
      const next = Array.from({ length: names.length }, (_, i) => previous[i] ?? 0);
      next[playerIndex] = value - (state.scores[playerIndex] ?? 0);
      return next;
    });
    if (value > (derivedScores[playerIndex] ?? 0)) lastScorerRef.current = playerIndex;
  };

  const miniApi = useMemo<MiniGameApi>(
    () => ({
      getPlayers: () =>
        names.map((name, playerIndex) => ({
          index: playerIndex,
          name,
          avatar: "",
          score: derivedScores[playerIndex] ?? 0,
        })),
      getLastScorerIndex: () => lastScorerRef.current ?? 0,
      getFirstPlaceStarterIndex: () => firstPlaceRef.current ?? 0,
      addPoints: addMiniPoints,
      setScore: setMiniScore,
      getLeaderScore: () => (derivedScores.length ? Math.max(...derivedScores) : 0),
      getLastPlaceIndexes: () => {
        if (!derivedScores.length) return [];
        const low = Math.min(...derivedScores);
        return derivedScores
          .map((score, playerIndex) => (score === low ? playerIndex : -1))
          .filter((playerIndex) => playerIndex >= 0);
      },
    }),
    [derivedScores, names, state.scores]
  );

  useEffect(() => {
    if (!derivedScores.length) {
      firstPlaceRef.current = null;
      return;
    }
    const high = Math.max(...derivedScores);
    const leaders = derivedScores
      .map((score, playerIndex) => (score === high ? playerIndex : -1))
      .filter((playerIndex) => playerIndex >= 0);
    if (leaders.length === 1) {
      firstPlaceRef.current = leaders[0];
    } else if (
      firstPlaceRef.current === null ||
      !leaders.includes(firstPlaceRef.current)
    ) {
      firstPlaceRef.current = leaders[0] ?? 0;
    }
  }, [derivedScores]);

  useEffect(() => {
    window.__tapMiniGameAPI = miniApi;
    return () => {
      if (window.__tapMiniGameAPI === miniApi) delete window.__tapMiniGameAPI;
    };
  }, [miniApi]);

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

  const chooseBank = async (next: BankId) => {
    setImporting(true);
    try {
      await selectBank(next, (message) => setStatus(message));
      refreshDatabaseMeta();
      setStatus(`${databaseSize().toLocaleString()} questions ready from ${databaseSource()}.`);
    } finally {
      setImporting(false);
    }
  };

  const importDatabase = async (file: File) => {
    setImporting(true);
    try {
      const count = await importCsvFile(file, (message) => setStatus(message));
      refreshDatabaseMeta();
      setStatus(`${count.toLocaleString()} questions are ready and saved on this browser.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not import that file.");
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
      setMiniAdjustments([]);
      lastScorerRef.current = null;
      firstPlaceRef.current = null;
      completedQuestionsRef.current = 0;
      setHistory([]);
      setRoundResult(null);
      setSetup(false);
      playStartSound();
      setStatus(
        `${mode === "host" ? `${hostName.trim() || "Host"} is hosting.` : `${nextNames[0]} reads first.`} ${nextQueue.length.toLocaleString()} questions ready.`
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not start the game.");
    } finally {
      setLoading(false);
    }
  };

  const showQuestion = () => {
    if (!currentQuestion || playState.winner !== null || roundResult) return;
    playShowQuestionSound();
    setState((prev) => revealQuestion(prev));
  };

  const showAnswer = () => {
    if (!currentQuestion || !state.questionVisible || state.winner !== null || roundResult) return;
    playShowAnswerSound();
    setState((prev) => revealAnswer(prev));
  };

  const nobodyKnows = () => {
    if (!currentQuestion || roundResult) return;
    if (!canShowNobodyKnows(currentQuestion.type, state.nobodyKnows)) return;
    playMultipleChoiceSound();
    setState((prev) => enableNobodyKnows(prev));
    setStatus("No one knows? Four choices. Tap a letter.");
  };

  const pickChoice = (choiceIndex: number) => {
    if (!currentQuestion || state.winner !== null || state.answerVisible || roundResult) return;
    const choice = choices[choiceIndex];
    if (!choice || state.eliminatedChoices.includes(choiceIndex)) return;
    if (choice.correct) {
      playCorrectSound();
      setState((prev) => ({ ...prev, answerVisible: true }));
      setRoundResult({
        kind: "mc-correct",
        playerIndex: null,
        name: "Somebody knew it",
        delta: 0,
        score: 0,
        answer: currentQuestion.answer,
        won: false,
        continueLabel: "Who got it?",
      });
      setStatus("That's the one. Tap who got it.");
      return;
    }
    playNopeSound();
    setState((prev) => eliminateChoice(prev, choiceIndex));
    setRoundResult({
      kind: "mc-wrong",
      playerIndex: null,
      name: choice.text,
      delta: 0,
      score: 0,
      answer: null,
      won: false,
      continueLabel: "Who missed it?",
    });
    setStatus("Nope. That choice is out. Tap who missed it.");
  };

  const markScore = (playerIndex: number, delta: 1 | -1) => {
    if (playState.winner !== null) return;
    if (roundResult && roundResult.kind !== "mc-correct" && roundResult.kind !== "mc-wrong") {
      return;
    }
    if (roundResult?.kind === "mc-correct" && delta < 0) return;
    if (roundResult?.kind === "mc-wrong" && delta > 0) return;
    snapshot(state);
    const result = applyScore({
      state,
      mode,
      playerIndex,
      delta,
      winTarget,
    });
    if (!result.accepted) return;
    if (delta > 0) lastScorerRef.current = playerIndex;
    if (result.won) playWinSound();
    else if (delta > 0) playCorrectSound();
    else playWrongSound();
    setState(result.state);
    const fromMcWrong = roundResult?.kind === "mc-wrong";
    const nextScore =
      (result.state.scores[playerIndex] ?? 0) + (miniAdjustments[playerIndex] ?? 0);
    const won = nextScore >= winTarget;
    setRoundResult({
      kind: delta > 0 ? "correct" : fromMcWrong ? "mc-wrong" : "wrong",
      playerIndex,
      name: names[playerIndex] ?? `Player ${playerIndex + 1}`,
      delta,
      score: nextScore,
      answer: delta > 0 ? currentQuestion?.answer ?? null : null,
      won,
      continueLabel: won
        ? "New game"
        : delta > 0
          ? mode === "host"
            ? "Next question"
            : "Next reader"
          : fromMcWrong
            ? "Try another"
            : "Keep going",
    });
    setStatus(
      `${names[playerIndex]} ${
        delta > 0 ? "answered correctly: +1 point." : "answered incorrectly: −1 point."
      }`
    );
  };

  const dismissRoundResult = () => {
    if (!roundResult || roundResult.won) return;
    const result = roundResult;
    setRoundResult(null);
    if (result.kind === "correct") {
      playNextReaderSound();
      const next = nextQuestionTurn({
        state,
        mode,
        playerCount: names.length,
        index,
        lastIndex: Math.max(0, queue.length - 1),
      });
      setIndex(next.index);
      setState(next.state);
      completedQuestionsRef.current += 1;
      if (completedQuestionsRef.current % 3 === 0) {
        window.setTimeout(() => {
          void launchMiniGame();
        }, 250);
      }
      setStatus(
        mode === "host"
          ? `${hostName.trim() || "Host"} asks the next question.`
          : `${names[next.state.reader]} reads next.`
      );
      return;
    }
    playContinueSound();
  };

  const nextReader = () => {
    if (!queue.length || state.winner !== null || roundResult) return;
    snapshot(state);
    playNextReaderSound();
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
    playUndoSound();
    const parsed = JSON.parse(previous) as { state: TapState; index: number };
    setHistory((prev) => prev.slice(0, -1));
    setState({
      ...emptyPlayState(parsed.state.scores.length),
      ...parsed.state,
      nobodyKnows: parsed.state.nobodyKnows ?? false,
      eliminatedChoices: parsed.state.eliminatedChoices ?? [],
    });
    setIndex(parsed.index);
    setRoundResult(null);
    setStatus("Last score change undone. Question position unchanged.");
  };

  const resetGame = () => {
    setSetup(true);
    setQueue([]);
    setIndex(0);
    setNames([]);
    setState(emptyPlayState());
    setMiniAdjustments([]);
    lastScorerRef.current = null;
    firstPlaceRef.current = null;
    completedQuestionsRef.current = 0;
    setHistory([]);
    setRoundResult(null);
    setStatus(
      dbCount
        ? `${dbCount.toLocaleString()} questions ready from ${dbSource}.`
        : "Choose settings and press Let's play."
    );
  };

  const launchMiniGame = async () => {
    try {
      await window.__launchTapMiniGame?.();
      setStatus("Mini game launched. Close it to return to the table.");
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Could not launch a mini game."
      );
    }
  };

  const readerName =
    mode === "host" ? hostName.trim() || "Host" : names[playState.reader] ?? "";
  const nextName =
    mode === "rotation" && names.length
      ? names[(playState.reader + 1) % names.length] ?? ""
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
    choices,
    state: playState,
    status,
    loading,
    importing,
    dbCount,
    dbSource,
    bank,
    chooseBank,
    typeCounts,
    types,
    toggleType,
    subtitle,
    readerName,
    nextName,
    historyLength: history.length,
    roundResult,
    importDatabase,
    startGame,
    showQuestion,
    showAnswer,
    nobodyKnows,
    pickChoice,
    markScore,
    dismissRoundResult,
    nextReader,
    undo,
    resetGame,
    launchMiniGame,
    canNobodyKnows: currentQuestion
      ? canShowNobodyKnows(currentQuestion.type, playState.nobodyKnows)
      : false,
    showChoiceButtons: currentQuestion
      ? showsChoices(currentQuestion.type, playState.nobodyKnows)
      : false,
    minPlayers: RULES.minPlayers,
    maxPlayers: RULES.maxPlayers,
    defaultWinByCount: DEFAULT_WIN_SCORE,
    ruleCopy: RULES,
  };
}

export type TapTriviaGame = ReturnType<typeof useTapTrivia>;
