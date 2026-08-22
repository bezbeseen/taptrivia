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
  buildMultipleChoices,
  levelLabel,
  loadQuestionBanks,
  type Level,
  type TriviaQuestion,
} from "@/lib/questions";
import {
  playAvatarSound,
  playConfirmSound,
  playContinueSound,
  playCorrectSound,
  playErrorSound,
  playMultipleChoiceSound,
  playNextReaderSound,
  playNopeSound,
  playResetSound,
  playRulesSound,
  playShowAnswerSound,
  playShowQuestionSound,
  playStartSound,
  playUndoSound,
  playUiTap,
  playWinSound,
  playWrongSound,
  ringAlarm,
} from "@/lib/sounds";
import { AVATARS } from "@/components/player-avatar";

export type GameState = {
  scores: number[];
  misses: number[];
  reader: number;
  winner: { index: number } | null;
  questionVisible: boolean;
  answerVisible: boolean;
  multipleChoice: boolean;
  missedThisQuestion: boolean[];
  eliminatedChoices: number[];
};

export type RoundResult = {
  kind: "correct" | "wrong" | "mc-correct" | "mc-wrong";
  playerIndex: number | null;
  name: string;
  avatar: number;
  delta: number;
  score: number;
  answer: string | null;
  won: boolean;
  allStumped: boolean;
  continueLabel: string;
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
    multipleChoice: false,
    missedThisQuestion: Array(count).fill(false),
    eliminatedChoices: [],
  };
}

export function useSlapTrivia() {
  const [setup, setSetup] = useState(true);
  const [rulesOpen, setRulesOpenState] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [level, setLevel] = useState<Level | "">("");
  const [playerCount, setPlayerCount] = useState(3);
  const [winTarget, setWinTarget] = useState(15);
  const [draftNames, setDraftNames] = useState(() =>
    Array.from({ length: 8 }, (_, i) => DEFAULT_NAMES[i] ?? "")
  );
  const [draftAvatars, setDraftAvatars] = useState(() =>
    Array.from({ length: 8 }, (_, i) => i % AVATARS.length)
  );
  const [names, setNames] = useState<string[]>([]);
  const [avatars, setAvatars] = useState<number[]>([]);
  const [activeLevel, setActiveLevel] = useState<Level | null>(null);
  const [pool, setPool] = useState<TriviaQuestion[]>([]);
  const [indexes, setIndexes] = useState<QuestionIndexes>(EMPTY_INDEXES);
  const [state, setState] = useState<GameState>(emptyState());
  const [history, setHistory] = useState<string[]>([]);
  const [status, setStatus] = useState("Set up the game to begin.");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [puzzleOpen, setPuzzleOpen] = useState(false);

  const questionIndex = activeLevel ? indexes[activeLevel] : 0;
  const currentQuestion = pool[questionIndex] ?? null;

  const snapshot = useCallback(() => {
    setHistory((prev) => {
      const next = [...prev, JSON.stringify(state)];
      return next.length > 100 ? next.slice(-100) : next;
    });
  }, [state]);

  const setRulesOpen = (open: boolean) => {
    playRulesSound();
    setRulesOpenState(open);
  };

  const chooseLevel = (value: Level | "") => {
    playUiTap();
    setLevel(value);
  };

  const setPlayerCountSafe = (count: number) => {
    playUiTap();
    setPlayerCount(Math.max(3, Math.min(8, count)));
  };

  const setDraftName = (index: number, value: string) => {
    setDraftNames((prev) => prev.map((name, i) => (i === index ? value : name)));
  };

  const cycleDraftAvatar = (index: number) => {
    playAvatarSound();
    setDraftAvatars((prev) =>
      prev.map((avatar, i) => (i === index ? (avatar + 1) % AVATARS.length : avatar))
    );
  };

  const cycleAvatar = (index: number) => {
    playAvatarSound();
    setAvatars((prev) =>
      prev.map((avatar, i) => (i === index ? (avatar + 1) % AVATARS.length : avatar))
    );
  };

  const advanceQuestion = useCallback(
    (from: GameState, nextIndexes: QuestionIndexes) => {
      if (!activeLevel) {
        return {
          nextState: {
            ...from,
            questionVisible: false,
            answerVisible: false,
            multipleChoice: false,
            missedThisQuestion: Array(from.scores.length).fill(false),
            eliminatedChoices: [],
          },
          nextIndexes,
        };
      }
      const updated = { ...nextIndexes };
      if (questionIndex < pool.length - 1) {
        updated[activeLevel] = questionIndex + 1;
      }
      saveQuestionIndexes(updated);
      return {
        nextState: {
          ...from,
          questionVisible: false,
          answerVisible: false,
          multipleChoice: false,
          missedThisQuestion: Array(from.scores.length).fill(false),
          eliminatedChoices: [],
        },
        nextIndexes: updated,
      };
    },
    [activeLevel, pool.length, questionIndex]
  );

  const startGame = () => {
    if (!level) {
      playErrorSound();
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
      setAvatars(draftAvatars.slice(0, count));
      setWinTarget(target);
      setActiveLevel(level);
      setPool(nextPool);
      setState(emptyState(count));
      setHistory([]);
      setSetup(false);
      setConfirmOpen(false);
      setRoundResult(null);
      setPuzzleOpen(false);
      playStartSound();
      setStatus(`${nextNames[0]} reads first.`);
    } catch (error) {
      playErrorSound();
      setLoadError(error instanceof Error ? error.message : "Could not load questions.");
      setStatus("Could not load questions.");
    } finally {
      setLoading(false);
    }
  };

  const showQuestion = () => {
    if (!currentQuestion || roundResult) return;
    if (state.answerVisible) {
      ringAlarm();
      setConfirmOpen(true);
      return;
    }
    playShowQuestionSound();
    setState((prev) => ({
      ...prev,
      questionVisible: true,
      answerVisible: false,
      multipleChoice: false,
      eliminatedChoices: [],
    }));
  };

  const confirmShowQuestion = () => {
    playConfirmSound();
    setConfirmOpen(false);
    setState((prev) => ({
      ...prev,
      questionVisible: true,
      answerVisible: false,
      multipleChoice: false,
      eliminatedChoices: [],
    }));
  };

  const showAnswer = () => {
    if (!currentQuestion || !state.questionVisible || roundResult) return;
    playShowAnswerSound();
    setState((prev) => ({ ...prev, answerVisible: true }));
  };

  const enableMultipleChoice = () => {
    if (!currentQuestion || !state.questionVisible || state.winner || roundResult) return;
    if (state.multipleChoice) return;
    playMultipleChoiceSound();
    setState((prev) => ({ ...prev, multipleChoice: true }));
    setStatus("Nobody knows? Four choices. Slap in, then pick one.");
  };

  const choices = useMemo(() => {
    if (!currentQuestion || !state.multipleChoice) return [];
    return buildMultipleChoices(currentQuestion, pool);
  }, [currentQuestion, pool, state.multipleChoice]);

  const pickChoice = (choiceIndex: number) => {
    if (!state.multipleChoice || state.winner || state.answerVisible || roundResult) {
      return;
    }
    const choice = choices[choiceIndex];
    if (!choice || state.eliminatedChoices.includes(choiceIndex)) return;
    if (choice.correct) {
      playCorrectSound();
      setState((prev) => ({
        ...prev,
        answerVisible: true,
        eliminatedChoices: prev.eliminatedChoices,
      }));
      setRoundResult({
        kind: "mc-correct",
        playerIndex: null,
        name: "Somebody knew it",
        avatar: 0,
        delta: 0,
        score: 0,
        answer: currentQuestion?.answer ?? choice.text,
        won: false,
        allStumped: false,
        continueLabel: "Who got it?",
      });
      setStatus("That's the one. Mark who got it.");
      return;
    }
    playNopeSound();
    setState((prev) => ({
      ...prev,
      eliminatedChoices: [...prev.eliminatedChoices, choiceIndex],
    }));
    setRoundResult({
      kind: "mc-wrong",
      playerIndex: null,
      name: choice.text,
      avatar: 0,
      delta: 0,
      score: 0,
      answer: null,
      won: false,
      allStumped: false,
      continueLabel: "Try another",
    });
    setStatus("Nope. Cross that one out and try another.");
  };

  const markCorrect = (index: number) => {
    if (index === state.reader || state.winner || roundResult) return;
    snapshot();
    const scores = [...state.scores];
    scores[index] = (scores[index] ?? 0) + 1;
    const won = (scores[index] ?? 0) >= winTarget;
    if (won) playWinSound();
    else playCorrectSound();
    setState({
      ...state,
      scores,
      answerVisible: true,
      winner: won ? { index } : state.winner,
    });
    setConfirmOpen(false);
    setRoundResult({
      kind: "correct",
      playerIndex: index,
      name: names[index] ?? `Player ${index + 1}`,
      avatar: avatars[index] ?? index,
      delta: 1,
      score: scores[index] ?? 1,
      answer: currentQuestion?.answer ?? null,
      won,
      allStumped: false,
      continueLabel: won ? "New game" : "Next question",
    });
    setStatus(`${names[index]} answered correctly: +1 point.`);
  };

  const markWrong = (index: number) => {
    if (index === state.reader || state.winner || roundResult) return;
    snapshot();
    playWrongSound();
    const misses = [...state.misses];
    const scores = [...state.scores];
    const missedThisQuestion = [...state.missedThisQuestion];
    misses[index] = (misses[index] ?? 0) + 1;
    missedThisQuestion[index] = true;
    const penalty = misses[index] ?? 1;
    scores[index] = (scores[index] ?? 0) - penalty;
    const competitors = names.map((_, i) => i).filter((i) => i !== state.reader);
    const allStumped =
      competitors.length > 0 &&
      competitors.every((i) => missedThisQuestion[i]) &&
      !state.multipleChoice;
    setState({
      ...state,
      misses,
      scores,
      missedThisQuestion,
    });
    setRoundResult({
      kind: "wrong",
      playerIndex: index,
      name: names[index] ?? `Player ${index + 1}`,
      avatar: avatars[index] ?? index,
      delta: -penalty,
      score: scores[index] ?? 0,
      answer: null,
      won: false,
      allStumped,
      continueLabel: allStumped ? "Multiple choice" : "Next slap",
    });
    setStatus(
      allStumped
        ? `${names[index]} was wrong: -${penalty}. Table's stumped.`
        : `${names[index]} was wrong: -${penalty}. Any other non-reader may answer next.`
    );
  };

  const dismissRoundResult = () => {
    if (!roundResult || roundResult.won) return;
    const result = roundResult;
    if (result.won) {
      resetGame();
      return;
    }
    if (!(result.kind === "wrong" && result.allStumped)) {
      playContinueSound();
    }
    setRoundResult(null);
    if (result.kind === "correct") {
      const advanced = advanceQuestion(state, indexes);
      setIndexes(advanced.nextIndexes);
      setState(advanced.nextState);
      setConfirmOpen(false);
      setStatus(
        `${names[state.reader] ?? "The reader"} reads. Press Show Question.`
      );
      if (names.length >= 2) {
        setPuzzleOpen(true);
      }
      return;
    }
    if (result.kind === "wrong" && result.allStumped) {
      playMultipleChoiceSound();
      setState((prev) => ({ ...prev, multipleChoice: true }));
      setStatus("Table's stumped — four choices. Slap in, then pick one.");
    }
  };

  const nextReader = () => {
    if (state.winner || !activeLevel || !names.length || roundResult) return;
    playNextReaderSound();
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
    playUndoSound();
    const previous = history[history.length - 1];
    if (!previous) return;
    setHistory((prev) => prev.slice(0, -1));
    const parsed = JSON.parse(previous) as GameState;
    const count = parsed.scores?.length ?? names.length;
    setRoundResult(null);
    setPuzzleOpen(false);
    setState({
      ...emptyState(count),
      ...parsed,
      missedThisQuestion: parsed.missedThisQuestion ?? Array(count).fill(false),
      eliminatedChoices: parsed.eliminatedChoices ?? [],
      multipleChoice: parsed.multipleChoice ?? false,
    });
    setConfirmOpen(false);
    setStatus("Last scoring action undone. Question position is unchanged.");
  };

  const resetGame = () => {
    playResetSound();
    setHistory([]);
    setState(emptyState());
    setConfirmOpen(false);
    setRoundResult(null);
    setPuzzleOpen(false);
    setActiveLevel(null);
    setPool([]);
    setNames([]);
    setAvatars([]);
    setSetup(true);
    setStatus("New game. Question progress is preserved by level.");
  };

  const endPuzzle = useCallback(() => {
    setPuzzleOpen(false);
  }, []);

  const subtitle = useMemo(() => {
    if (setup || !activeLevel) return "Trivia showdown";
    return `First to ${winTarget} net points wins`;
  }, [activeLevel, setup, winTarget]);

  const readerName = names[state.reader] ?? "";
  const nextReaderName = names.length
    ? (names[(state.reader + 1) % names.length] ?? "")
    : "";
  const readerAvatar = avatars[state.reader] ?? 0;

  return {
    setup,
    rulesOpen,
    setRulesOpen,
    confirmOpen,
    setConfirmOpen,
    level,
    setLevel: chooseLevel,
    playerCount,
    setPlayerCountSafe,
    winTarget,
    setWinTarget,
    draftNames,
    setDraftName,
    draftAvatars,
    cycleDraftAvatar,
    names,
    avatars,
    cycleAvatar,
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
    nextReaderName,
    readerAvatar,
    historyLength: history.length,
    levels: LEVELS,
    startGame,
    showQuestion,
    confirmShowQuestion,
    showAnswer,
    enableMultipleChoice,
    choices,
    pickChoice,
    markCorrect,
    markWrong,
    roundResult,
    dismissRoundResult,
    puzzleOpen,
    endPuzzle,
    nextReader,
    undo,
    resetGame,
  };
}
