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
  source: string;
};

export type TapState = {
  scores: number[];
  reader: number;
  winner: number | null;
  questionVisible: boolean;
  answerVisible: boolean;
};

export type TypeFilter = Record<TapQuestionType, boolean>;
