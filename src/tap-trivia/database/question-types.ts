import type { TapQuestion, TapQuestionType, TypeFilter } from "@/tap-trivia/types";

export const QUESTION_TYPES: {
  id: TapQuestionType;
  label: string;
  hint: string;
}[] = [
  {
    id: "open",
    label: "Open answer",
    hint: "Spoken short answer. No choices shown.",
  },
  {
    id: "boolean",
    label: "True / False",
    hint: "Two options. Reader still says it out loud.",
  },
  {
    id: "multiple",
    label: "Multiple choice",
    hint: "Four shuffled options, A–D.",
  },
];

export const ALL_TYPES_ON: TypeFilter = {
  open: true,
  boolean: true,
  multiple: true,
};

export function detectQuestionType(input: {
  answer: string;
  declaredType?: string;
  options: string[];
}): TapQuestionType {
  const answer = input.answer.trim().toLowerCase();
  const declared = (input.declaredType || "").trim().toLowerCase();
  if (answer === "true" || answer === "false" || declared === "boolean") {
    return "boolean";
  }
  if (declared === "multiple" || input.options.length === 4) {
    return "multiple";
  }
  return "open";
}

export function filterByTypes(
  questions: TapQuestion[],
  types: TypeFilter
): TapQuestion[] {
  const enabled = QUESTION_TYPES.filter((item) => types[item.id]).map((item) => item.id);
  if (!enabled.length) return [];
  return questions.filter((question) => enabled.includes(question.type));
}

export function countByType(questions: TapQuestion[]): Record<TapQuestionType, number> {
  return questions.reduce(
    (counts, question) => {
      counts[question.type] += 1;
      return counts;
    },
    { open: 0, boolean: 0, multiple: 0 } as Record<TapQuestionType, number>
  );
}
