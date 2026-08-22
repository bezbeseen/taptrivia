import rawQuestions from "@/data/questions.json";

export type Level = "easy" | "medium" | "hard" | "smart" | "mix";

export type TriviaQuestion = {
  question: string;
  answer: string;
  difficulty: Level;
  order: number;
  category: string;
  distractors: string[];
};

export const LEVELS: { value: Level; label: string }[] = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
  { value: "smart", label: "Smart AF" },
  { value: "mix", label: "Mix" },
];

export function levelLabel(level: Level): string {
  return LEVELS.find((item) => item.value === level)?.label ?? level;
}

type SourceQuestion = {
  question?: string;
  answer?: string;
  difficulty?: string;
  category?: string;
  distractors?: unknown;
};

function asDifficulty(value: string | undefined): Exclude<Level, "mix"> {
  const key = (value || "").toLowerCase();
  if (key === "easy" || key === "medium" || key === "hard" || key === "smart") return key;
  if (key === "medium-hard") return "hard";
  return "medium";
}

function asDistractors(value: unknown, answer: string): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set([answer.trim().toLowerCase()]);
  const out: string[] = [];
  for (const item of value) {
    const text = String(item ?? "").trim();
    const key = text.toLowerCase();
    if (!text || seen.has(key) || text.length > 48) continue;
    seen.add(key);
    out.push(text);
    if (out.length === 3) break;
  }
  return out;
}

export function seededShuffle<T>(items: T[], seed: number): T[] {
  const arr = items.slice();
  let s = seed >>> 0;
  const rnd = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

function withOrder(items: TriviaQuestion[], seed: number): TriviaQuestion[] {
  return seededShuffle(items, seed).map((item, index) => ({ ...item, order: index + 1 }));
}

function interleave(groups: TriviaQuestion[][], seed: number): TriviaQuestion[] {
  const shuffled = groups.map((group, index) => seededShuffle(group, seed + index * 97));
  const out: TriviaQuestion[] = [];
  const max = Math.max(0, ...shuffled.map((group) => group.length));
  for (let i = 0; i < max; i++) {
    for (const group of shuffled) {
      const item = group[i];
      if (item) out.push(item);
    }
  }
  return out.map((item, index) => ({ ...item, difficulty: "mix" as const, order: index + 1 }));
}

export type QuestionBanks = Record<Level, TriviaQuestion[]>;

let cache: QuestionBanks | null = null;

export function loadQuestionBanks(): QuestionBanks {
  if (cache) return cache;
  const parsed: TriviaQuestion[] = [];
  for (const item of rawQuestions as SourceQuestion[]) {
    const question = String(item.question ?? "").trim();
    const answer = String(item.answer ?? "").trim();
    if (!question || !answer) continue;
    parsed.push({
      question,
      answer,
      difficulty: asDifficulty(item.difficulty),
      order: 0,
      category: String(item.category ?? "General Knowledge").trim() || "General Knowledge",
      distractors: asDistractors(item.distractors, answer),
    });
  }

  const unique = [...new Map(parsed.map((item) => [item.question.trim().toLowerCase(), item])).values()];

  const easySource = unique.filter((item) => item.difficulty === "easy");
  const mediumSource = unique.filter((item) => item.difficulty === "medium");
  const hardSource = unique.filter((item) => item.difficulty === "hard");
  const smartSource = unique.filter((item) => item.difficulty === "smart");
  const easy = withOrder(easySource.length ? easySource : mediumSource, 1101);
  const medium = withOrder(mediumSource.length ? mediumSource : unique, 2202);
  const hard = withOrder(hardSource.length ? hardSource : medium, 3303);
  const smart = withOrder(smartSource.length ? smartSource : hardSource.length ? hardSource : medium, 4404);
  const mix = interleave([easy, medium, hard, smart], 5505);
  cache = { easy, medium, hard, smart, mix };
  return cache;
}

function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export type MultipleChoice = {
  text: string;
  correct: boolean;
};

export function buildMultipleChoices(
  question: TriviaQuestion,
  pool: TriviaQuestion[],
  count = 4
): MultipleChoice[] {
  const correct = question.answer.trim();
  const seen = new Set([correct.toLowerCase()]);
  const distractors: string[] = [];

  for (const text of question.distractors) {
    const answer = text.trim();
    const key = answer.toLowerCase();
    if (!answer || seen.has(key)) continue;
    seen.add(key);
    distractors.push(answer);
    if (distractors.length >= count - 1) break;
  }

  const sameCategory = seededShuffle(
    pool.filter((item) => item.category === question.category),
    hashSeed(question.question + "cat")
  );
  const rest = seededShuffle(pool, hashSeed(question.question + question.order));
  for (const item of [...sameCategory, ...rest]) {
    if (distractors.length >= count - 1) break;
    const answer = item.answer.trim();
    const key = answer.toLowerCase();
    if (!answer || seen.has(key)) continue;
    seen.add(key);
    distractors.push(answer);
  }

  const fallback = ["Red herring", "Nobody knows", "Skip this", "A wild guess"];
  while (distractors.length < count - 1) {
    const extra = fallback[distractors.length] ?? `Option ${distractors.length + 2}`;
    if (!seen.has(extra.toLowerCase())) {
      seen.add(extra.toLowerCase());
      distractors.push(extra);
    } else {
      break;
    }
  }

  return seededShuffle(
    [{ text: correct, correct: true }, ...distractors.map((text) => ({ text, correct: false }))],
    hashSeed(question.answer + "mc")
  );
}

export function bankCounts(banks: QuestionBanks): Record<Level, number> {
  return {
    easy: banks.easy.length,
    medium: banks.medium.length,
    hard: banks.hard.length,
    smart: banks.smart.length,
    mix: banks.mix.length,
  };
}
