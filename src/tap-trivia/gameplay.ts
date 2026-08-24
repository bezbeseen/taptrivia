import { canPlayerScore, hasWon, nextReaderIndex } from "@/tap-trivia/rules";
import type { TapMode, TapState } from "@/tap-trivia/types";

export function emptyPlayState(count = 0): TapState {
  return {
    scores: Array(count).fill(0),
    reader: 0,
    winner: null,
    questionVisible: false,
    answerVisible: false,
    nobodyKnows: false,
    eliminatedChoices: [],
  };
}

export function revealQuestion(state: TapState): TapState {
  if (state.winner !== null) return state;
  return {
    ...state,
    questionVisible: true,
    answerVisible: false,
    nobodyKnows: false,
    eliminatedChoices: [],
  };
}

export function revealAnswer(state: TapState): TapState {
  if (state.winner !== null || !state.questionVisible) return state;
  return { ...state, answerVisible: true };
}

export function hideCard(state: TapState): TapState {
  return {
    ...state,
    questionVisible: false,
    answerVisible: false,
    nobodyKnows: false,
    eliminatedChoices: [],
  };
}

export function enableNobodyKnows(state: TapState): TapState {
  if (state.winner !== null || !state.questionVisible || state.nobodyKnows) return state;
  return { ...state, nobodyKnows: true };
}

export function eliminateChoice(state: TapState, choiceIndex: number): TapState {
  if (state.eliminatedChoices.includes(choiceIndex)) return state;
  return {
    ...state,
    eliminatedChoices: [...state.eliminatedChoices, choiceIndex],
  };
}

export function applyScore(options: {
  state: TapState;
  mode: TapMode;
  playerIndex: number;
  delta: number;
  winTarget: number;
}): { state: TapState; accepted: boolean; won: boolean } {
  const { state, mode, playerIndex, delta, winTarget } = options;
  if (state.winner !== null) return { state, accepted: false, won: false };
  if (!canPlayerScore(mode, state.reader, playerIndex)) {
    return { state, accepted: false, won: false };
  }
  const scores = [...state.scores];
  scores[playerIndex] = (scores[playerIndex] ?? 0) + delta;
  const won = delta > 0 && hasWon(scores[playerIndex] ?? 0, winTarget);
  return {
    accepted: true,
    won,
    state: {
      ...state,
      scores,
      answerVisible: delta > 0 ? true : state.answerVisible,
      winner: won ? playerIndex : null,
    },
  };
}

export function passTurn(options: {
  state: TapState;
  mode: TapMode;
  playerCount: number;
}): TapState {
  const hidden = hideCard(options.state);
  if (options.mode !== "rotation") return hidden;
  return {
    ...hidden,
    reader: nextReaderIndex(hidden, options.playerCount),
  };
}

export function advanceRound(
  state: TapState,
  index: number,
  lastIndex: number
): { state: TapState; index: number } {
  return {
    state: hideCard(state),
    index: index < lastIndex ? index + 1 : index,
  };
}

export function nextQuestionTurn(options: {
  state: TapState;
  mode: TapMode;
  playerCount: number;
  index: number;
  lastIndex: number;
}): { state: TapState; index: number } {
  const advanced = advanceRound(options.state, options.index, options.lastIndex);
  return {
    index: advanced.index,
    state: {
      ...advanced.state,
      reader:
        options.mode === "rotation"
          ? nextReaderIndex(options.state, options.playerCount)
          : options.state.reader,
    },
  };
}
