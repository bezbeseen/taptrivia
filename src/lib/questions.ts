import rawQuestions from "@/data/questions.json";

export type Level = "easy" | "medium" | "hard" | "smart" | "mix";

export type TriviaQuestion = {
  question: string;
  answer: string;
  difficulty: Level;
  order: number;
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
};

function seededShuffle<T>(items: T[], seed: number): T[] {
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

function variantQuestion(text: string, level: Exclude<Level, "mix">, variant: number): string {
  const q = text.trim().replace(/\s+/g, " ").replace(/\?$/, "");
  const styles = {
    easy: ["What is the answer to this: ", "Quick one: ", "Name this: ", "Identify this: "],
    medium: [
      "Answer this: ",
      "Identify the correct answer: ",
      "Trivia question: ",
      "Name the answer: ",
    ],
    hard: [
      "Be precise: ",
      "Give the exact answer: ",
      "Advanced trivia: ",
      "Identify precisely: ",
    ],
    smart: [
      "Smart AF: ",
      "No hints — identify this: ",
      "Expert-level: ",
      "Give the most precise answer: ",
    ],
  };
  return `${styles[level][variant % 4]}${q}?`;
}

function buildPool(
  source: { question: string; answer: string }[],
  level: Exclude<Level, "mix">,
  count: number,
  seed: number
): TriviaQuestion[] {
  const shuffled = seededShuffle(source, seed);
  const out: TriviaQuestion[] = [];
  const seen = new Set<string>();
  let pass = 0;
  while (out.length < count) {
    for (let i = 0; i < shuffled.length && out.length < count; i++) {
      const item = shuffled[i]!;
      const question =
        pass === 0
          ? variantQuestion(item.question, level, pass)
          : variantQuestion(item.question, level, pass + (i % 4));
      const key = question.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        question,
        answer: item.answer,
        difficulty: level,
        order: out.length + 1,
      });
    }
    pass += 1;
  }
  return seededShuffle(out, seed + 777).map((q, i) => ({ ...q, order: i + 1 }));
}

export type QuestionBanks = Record<Level, TriviaQuestion[]>;

let cache: QuestionBanks | null = null;

export function loadQuestionBanks(): QuestionBanks {
  if (cache) return cache;
  const flattened = (rawQuestions as unknown[])
    .flat()
    .map((item) => {
      if (Array.isArray(item)) {
        return { question: String(item[0] ?? ""), answer: String(item[1] ?? "") };
      }
      const q = item as SourceQuestion;
      return { question: q.question ?? "", answer: q.answer ?? "" };
    })
    .filter((item) => item.question && item.answer);
  const unique = [
    ...new Map(flattened.map((item) => [item.question.trim().toLowerCase(), item])).values(),
  ];
  const easy = buildPool(unique, "easy", 1500, 1101);
  const medium = buildPool(unique, "medium", 1500, 2202);
  const hard = buildPool(unique, "hard", 1500, 3303);
  const smart = buildPool(unique, "smart", 1500, 4404);
  const mix = seededShuffle(
    [...easy.slice(0, 300), ...medium.slice(0, 750), ...hard.slice(0, 300), ...smart.slice(0, 150)],
    5505
  ).map((q, i) => ({ ...q, difficulty: "mix" as const, order: i + 1 }));
  cache = { easy, medium, hard, smart, mix };
  return cache;
}
