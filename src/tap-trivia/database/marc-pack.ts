import { loadQuestionBanks, type TriviaQuestion } from "@/lib/questions";
import type { TapDifficulty, TapQuestion } from "@/tap-trivia/types";
import { detectQuestionType } from "./question-types";

function fromMarcDifficulty(difficulty: TapDifficulty): TapQuestion[] {
  const banks = loadQuestionBanks();
  const pool: TriviaQuestion[] = banks[difficulty] ?? [];
  return pool.map((item, index) => {
    const distractors = (item.distractors ?? []).map((value) => value.trim()).filter(Boolean);
    const options = [item.answer, ...distractors]
      .map((value) => value.trim())
      .filter(Boolean)
      .slice(0, 4);
    const type = detectQuestionType({
      answer: item.answer,
      declaredType: options.length === 4 ? "multiple" : undefined,
      options,
    });
    return {
      id: `marc-pack-${difficulty}-${index}`,
      sourceQuestion: item.question,
      question: item.question,
      answer: item.answer,
      category: item.category || "General Knowledge",
      difficulty,
      type,
      options: type === "multiple" ? options : [],
      distractors,
      source: "Marc pack",
    };
  });
}

export function marcPackQuestions(): TapQuestion[] {
  return [
    ...fromMarcDifficulty("easy"),
    ...fromMarcDifficulty("medium"),
    ...fromMarcDifficulty("hard"),
  ];
}
