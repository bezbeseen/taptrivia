export type TapDifficulty = "easy" | "medium" | "hard";
export type TapMode = "rotation" | "host";
export type TapQuestionType = "open" | "boolean" | "multiple";

export type TapQuestion = {
  id: string;
  sourceQuestion: string;
  question: string;
  answer: string;
  category: string;
  difficulty: TapDifficulty;
  type: TapQuestionType;
  options: string[];
  distractors?: string[];
  source: string;
};

export type TapState = {
  scores: number[];
  reader: number;
  winner: number | null;
  questionVisible: boolean;
  answerVisible: boolean;
  nobodyKnows: boolean;
  eliminatedChoices: number[];
};

export type TapChoice = {
  text: string;
  correct: boolean;
};

export type TapRoundResult = {
  kind: "correct" | "wrong" | "mc-correct" | "mc-wrong";
  playerIndex: number | null;
  name: string;
  delta: number;
  score: number;
  answer: string | null;
  won: boolean;
  continueLabel: string;
};

export type BankId = "table" | "marc" | "upload";

export type TypeFilter = Record<TapQuestionType, boolean>;
