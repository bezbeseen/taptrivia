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
  playCorrectSound,
  playMultipleChoiceSound,
  playNopeSound,
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
  const [rulesOpen, setRulesOpen] = useState(false);
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

  const cycleDraftAvatar = (index: number) => {
    setDraftAvatars((prev) =>
      prev.map((avatar, i) => (i === index ? (avatar + 1) % AVATARS.length : avatar))
    );
  };

  const cycleAvatar = (index: number) => {
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
    setState((prev) => ({
      ...prev,
      questionVisible: true,
      answerVisible: false,
      multipleChoice: false,
      eliminatedChoices: [],
    }));
  };

  const confirmShowQuestion = () => {
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
    if (!currentQuestion || !state.questionVisible) return;
    setState((prev) => ({ ...prev, answerVisible: true }));
  };

  const enableMultipleChoice = () => {
    if (!currentQuestion || !state.questionVisible || state.winner) return;
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
    if (!state.multipleChoice || state.winner || state.answerVisible) return;
    const choice = choices[choiceIndex];
    if (!choice || state.eliminatedChoices.includes(choiceIndex)) return;
    if (choice.correct) {
      playCorrectSound();
      setState((prev) => ({
        ...prev,
        answerVisible: true,
        eliminatedChoices: prev.eliminatedChoices,
      }));
      setStatus("That's the one. Mark who got it.");
      return;
    }
    playNopeSound();
    setState((prev) => ({
      ...prev,
      eliminatedChoices: [...prev.eliminatedChoices, choiceIndex],
    }));
    setStatus("Nope. Cross that one out and try another.");
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
    const missedThisQuestion = [...state.missedThisQuestion];
    misses[index] = (misses[index] ?? 0) + 1;
    missedThisQuestion[index] = true;
    const penalty = misses[index] ?? 1;
    scores[index] = (scores[index] ?? 0) - penalty;
    const competitors = names.map((_, i) => i).filter((i) => i !== state.reader);
    const allStumped =
      competitors.length > 0 && competitors.every((i) => missedThisQuestion[i]);
    const next: GameState = {
      ...state,
      misses,
      scores,
      missedThisQuestion,
      multipleChoice: state.multipleChoice || allStumped,
    };
    setState(next);
    if (allStumped && !state.multipleChoice) {
      playMultipleChoiceSound();
      setStatus(
        `${names[index]} was wrong: -${penalty}. Table's stumped — multiple choice is up.`
      );
      return;
    }
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
    const parsed = JSON.parse(previous) as GameState;
    const count = parsed.scores?.length ?? names.length;
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
    setHistory([]);
    setState(emptyState());
    setConfirmOpen(false);
    setActiveLevel(null);
    setPool([]);
    setNames([]);
    setAvatars([]);
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
    nextReader,
    undo,
    resetGame,
  };
}
