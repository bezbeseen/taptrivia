"use client";

import { useEffect, useMemo, useState } from "react";
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
    return buildPlayableChoices(currentQuestion, queue, state.nobodyKnows);
  }, [currentQuestion, queue, state.nobodyKnows]);

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
    if (!currentQuestion || state.winner !== null || roundResult) return;
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
      continueLabel: "Try another",
    });
    setStatus("Nope. That choice is out. Try another.");
  };

  const markScore = (playerIndex: number, delta: 1 | -1) => {
    if (state.winner !== null) return;
    if (roundResult && roundResult.kind !== "mc-correct") return;
    if (roundResult?.kind === "mc-correct" && delta < 0) return;
    snapshot(state);
    const result = applyScore({
      state,
      mode,
      playerIndex,
      delta,
      winTarget,
    });
    if (!result.accepted) return;
    if (result.won) playWinSound();
    else if (delta > 0) playCorrectSound();
    else playWrongSound();
    setState(result.state);
    setRoundResult({
      kind: delta > 0 ? "correct" : "wrong",
      playerIndex,
      name: names[playerIndex] ?? `Player ${playerIndex + 1}`,
      delta,
      score: result.state.scores[playerIndex] ?? 0,
      answer: delta > 0 ? currentQuestion?.answer ?? null : null,
      won: result.won,
      continueLabel: result.won
        ? "New game"
        : delta > 0
          ? mode === "host"
            ? "Next question"
            : "Next reader"
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
    setHistory([]);
    setRoundResult(null);
    setStatus(
      dbCount
        ? `${dbCount.toLocaleString()} questions ready from ${dbSource}.`
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
    choices,
    state,
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
    canNobodyKnows: currentQuestion
      ? canShowNobodyKnows(currentQuestion.type, state.nobodyKnows)
      : false,
    showChoiceButtons: currentQuestion
      ? showsChoices(currentQuestion.type, state.nobodyKnows)
      : false,
    minPlayers: RULES.minPlayers,
    maxPlayers: RULES.maxPlayers,
    defaultWinByCount: DEFAULT_WIN_SCORE,
    ruleCopy: RULES,
  };
}

export type TapTriviaGame = ReturnType<typeof useTapTrivia>;
