"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_WIN_SCORE,
  databaseSize,
  databaseSource,
  importCsvFile,
  initDatabase,
  loadTapQueue,
  type TapDifficulty,
  type TapMode,
  type TapQuestion,
} from "@/lib/tap-trivia-engine";

export type TapState = {
  scores: number[];
  reader: number;
  winner: number | null;
  questionVisible: boolean;
  answerVisible: boolean;
};

const DEFAULT_NAMES = ["Bez", "Sean", "Marc", "Player 4", "Player 5", "Player 6"];

function emptyState(count = 0): TapState {
  return {
    scores: Array(count).fill(0),
    reader: 0,
    winner: null,
    questionVisible: false,
    answerVisible: false,
  };
}

function playTone(
  freq: number,
  start: number,
  duration: number,
  volume = 0.16,
  type: OscillatorType = "sine",
  endFreq: number | null = null
) {
  const Ctor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return;
  const ctx = new Ctor();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
  if (endFreq) {
    osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + start + duration);
  }
  gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime + start);
  osc.stop(ctx.currentTime + start + duration + 0.02);
}

function playCorrect() {
  playTone(880, 0, 0.14, 0.18);
  playTone(1175, 0.18, 0.18, 0.18);
  playTone(1568, 0.39, 0.26, 0.2);
}

function playWrong() {
  playTone(260, 0, 0.22, 0.2, "sawtooth", 190);
  playTone(190, 0.2, 0.25, 0.18, "sawtooth", 125);
  playTone(125, 0.42, 0.38, 0.16, "sawtooth", 72);
}

function playWinner() {
  const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.51];
  notes.forEach((freq, index) => {
    playTone(freq, index * 0.13, index === notes.length - 1 ? 0.55 : 0.2, 0.19, "triangle");
  });
}

export function useTapTrivia() {
  const [setup, setSetup] = useState(true);
  const [difficulty, setDifficulty] = useState<TapDifficulty | "">("");
  const [mode, setMode] = useState<TapMode>("rotation");
  const [playerCount, setPlayerCount] = useState(3);
  const [winTarget, setWinTarget] = useState(DEFAULT_WIN_SCORE[3] ?? 11);
  const [hostName, setHostName] = useState("Host");
  const [draftNames, setDraftNames] = useState(() => DEFAULT_NAMES.slice());
  const [names, setNames] = useState<string[]>([]);
  const [queue, setQueue] = useState<TapQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [state, setState] = useState<TapState>(emptyState());
  const [history, setHistory] = useState<string[]>([]);
  const [status, setStatus] = useState("Choose settings and press Let's play.");
  const [loading, setLoading] = useState(false);
  const [dbCount, setDbCount] = useState(0);
  const [dbSource, setDbSource] = useState("bundled library");
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    void initDatabase((message) => setStatus(message))
      .then(() => {
        setDbCount(databaseSize());
        setDbSource(databaseSource());
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
    const next = Math.max(2, Math.min(6, count));
    setPlayerCount(next);
    setWinTarget(DEFAULT_WIN_SCORE[next] ?? 11);
  };

  const setDraftName = (playerIndex: number, value: string) => {
    setDraftNames((prev) => prev.map((name, i) => (i === playerIndex ? value : name)));
  };

  const importDatabase = async (file: File) => {
    setImporting(true);
    try {
      const count = await importCsvFile(file, (message) => setStatus(message));
      setDbCount(count);
      setDbSource(file.name);
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
        onStatus: (message) => setStatus(message),
      });
      const count = playerCount;
      const nextNames = Array.from({ length: count }, (_, i) => {
        const value = draftNames[i]?.trim();
        return value || `Player ${i + 1}`;
      });
      const target = Math.max(1, Math.min(99, winTarget || DEFAULT_WIN_SCORE[count] || 11));
      setQueue(nextQueue);
      setIndex(0);
      setNames(nextNames);
      setWinTarget(target);
      setState(emptyState(count));
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
    setState((prev) => ({ ...prev, questionVisible: true, answerVisible: false }));
  };

  const showAnswer = () => {
    if (!currentQuestion || !state.questionVisible || state.winner !== null) return;
    setState((prev) => ({ ...prev, answerVisible: true }));
  };

  const advance = (from: TapState) => {
    const nextIndex = index < queue.length - 1 ? index + 1 : index;
    setIndex(nextIndex);
    return {
      ...from,
      questionVisible: false,
      answerVisible: false,
    };
  };

  const markScore = (playerIndex: number, delta: 1 | -1) => {
    if (state.winner !== null) return;
    if (mode === "rotation" && playerIndex === state.reader) return;
    snapshot(state);
    const scores = [...state.scores];
    scores[playerIndex] = (scores[playerIndex] ?? 0) + delta;
    const won = delta > 0 && (scores[playerIndex] ?? 0) >= winTarget;
    if (won) playWinner();
    else if (delta > 0) playCorrect();
    else playWrong();
    const nextState: TapState = {
      ...state,
      scores,
      winner: won ? playerIndex : null,
    };
    setState(delta > 0 ? advance(nextState) : nextState);
    setStatus(
      `${names[playerIndex]} ${
        delta > 0 ? "answered correctly: +1 point." : "answered incorrectly: −1 point."
      }`
    );
  };

  const nextReader = () => {
    if (!queue.length || state.winner !== null) return;
    snapshot(state);
    const advanced = advance(state);
    const reader =
      mode === "rotation" && names.length
        ? (state.reader + 1) % names.length
        : state.reader;
    setState({ ...advanced, reader });
    setStatus(
      mode === "host"
        ? `${hostName.trim() || "Host"} asks the next question.`
        : `${names[reader]} reads next.`
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
    setState(emptyState());
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
    subtitle,
    readerName,
    nextName,
    historyLength: history.length,
    importDatabase,
    startGame,
    showQuestion,
    showAnswer,
    markScore,
    nextReader,
    undo,
    resetGame,
  };
}
