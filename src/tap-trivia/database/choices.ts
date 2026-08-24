import { seededShuffle } from "@/lib/questions";
import type { TapChoice, TapQuestion } from "@/tap-trivia/types";

function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function buildPlayableChoices(
  question: TapQuestion,
  pool: TapQuestion[],
  nobodyKnows: boolean
): TapChoice[] {
  const answer = question.answer.trim();
  const answerKey = answer.toLowerCase();

  if (question.type === "boolean") {
    return [
      { text: "True", correct: answerKey === "true" },
      { text: "False", correct: answerKey === "false" },
    ];
  }

  if (question.type !== "multiple" && !nobodyKnows) return [];

  if (question.type === "multiple" && question.options.length) {
    return question.options.map((text) => ({
      text,
      correct: text.trim().toLowerCase() === answerKey,
    }));
  }

  const seen = new Set([answerKey]);
  const distractors: string[] = [];
  for (const text of question.distractors ?? []) {
    const value = text.trim();
    const key = value.toLowerCase();
    if (!value || seen.has(key)) continue;
    seen.add(key);
    distractors.push(value);
    if (distractors.length >= 3) break;
  }

  const sameCategory = seededShuffle(
    pool.filter((item) => item.category === question.category),
    hashSeed(question.sourceQuestion + "cat")
  );
  const rest = seededShuffle(pool, hashSeed(question.sourceQuestion + question.answer));
  for (const item of [...sameCategory, ...rest]) {
    if (distractors.length >= 3) break;
    const value = item.answer.trim();
    const key = value.toLowerCase();
    if (!value || seen.has(key)) continue;
    seen.add(key);
    distractors.push(value);
  }

  const fallback = ["Red herring", "Close, but no", "Not this one", "A wild guess"];
  while (distractors.length < 3) {
    const extra = fallback[distractors.length] ?? `Option ${distractors.length + 2}`;
    if (seen.has(extra.toLowerCase())) break;
    seen.add(extra.toLowerCase());
    distractors.push(extra);
  }

  return seededShuffle(
    [{ text: answer, correct: true }, ...distractors.map((text) => ({ text, correct: false }))],
    hashSeed(question.answer + "mc")
  );
}
