import type { TapQuestion } from "@/tap-trivia/types";

function shuffle<T>(items: T[]): T[] {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

export function formatOpen(question: TapQuestion): TapQuestion {
  return {
    ...question,
    options: [],
    question: question.sourceQuestion,
  };
}

export function formatTrueFalse(question: TapQuestion): TapQuestion {
  return {
    ...question,
    options: ["True", "False"],
    question: question.sourceQuestion,
  };
}

export function formatMultipleChoice(question: TapQuestion): TapQuestion {
  const options = shuffle(
    question.options.length === 4
      ? question.options
      : [question.answer, ...question.options].slice(0, 4)
  );
  return {
    ...question,
    options,
    question: question.sourceQuestion,
  };
}

export function presentQuestion(question: TapQuestion): TapQuestion {
  if (question.type === "boolean") return formatTrueFalse(question);
  if (question.type === "multiple") return formatMultipleChoice(question);
  return formatOpen(question);
}
