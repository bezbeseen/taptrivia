import type { Level } from "@/lib/questions";

const KEY = "slap-15-question-indexes-v2";

export type QuestionIndexes = Record<Level, number>;

export const EMPTY_INDEXES: QuestionIndexes = {
  easy: 0,
  medium: 0,
  hard: 0,
  smart: 0,
  mix: 0,
};

export function loadQuestionIndexes(): QuestionIndexes {
  if (typeof window === "undefined") return { ...EMPTY_INDEXES };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY_INDEXES };
    const parsed = JSON.parse(raw) as Partial<QuestionIndexes>;
    return {
      easy: Number(parsed.easy) || 0,
      medium: Number(parsed.medium) || 0,
      hard: Number(parsed.hard) || 0,
      smart: Number(parsed.smart) || 0,
      mix: Number(parsed.mix) || 0,
    };
  } catch {
    return { ...EMPTY_INDEXES };
  }
}

export function saveQuestionIndexes(indexes: QuestionIndexes) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(indexes));
  } catch {
    /* storage optional */
  }
}
