import { loadQuestionBanks, type TriviaQuestion } from "@/lib/questions";
import type { TapDifficulty, TapQuestion } from "@/tap-trivia/types";
import { detectQuestionType } from "./question-types";

export function fromBundled(difficulty: TapDifficulty): TapQuestion[] {
  const banks = loadQuestionBanks();
  const pool: TriviaQuestion[] = banks[difficulty] ?? [];
  return pool.map((item, index) => {
    const options = [item.answer, ...(item.distractors ?? [])]
      .map((value) => value.trim())
      .filter(Boolean)
      .slice(0, 4);
    const type = detectQuestionType({
      answer: item.answer,
      options,
    });
    return {
      id: `bundled-${difficulty}-${index}`,
      sourceQuestion: item.question,
      question: item.question,
      answer: item.answer,
      category: item.category || "General Knowledge",
      difficulty,
      type,
      options: type === "multiple" ? options : [],
      source: "Tap Trivia bundled library",
    };
  });
}

export function allBundledQuestions(): TapQuestion[] {
  return [...fromBundled("easy"), ...fromBundled("medium"), ...fromBundled("hard")];
}
