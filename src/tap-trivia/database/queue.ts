import type { TapQuestion } from "@/tap-trivia/types";
import { RULES } from "@/tap-trivia/rules";
import { presentQuestion } from "./multiple-choice";

export const TAP_CATEGORIES = [
  "General Knowledge",
  "Geography",
  "Movies",
  "Music",
  "Literature & Language",
  "History",
  "Television",
  "Sports",
  "Arts, Culture & Technology",
  "Science & Nature",
  "Food & Drink",
  "Pop Culture & Celebrities",
] as const;

export function buildQueue(items: TapQuestion[]): TapQuestion[] {
  const byCategory = new Map<string, Array<TapQuestion & { categoryPosition: number }>>();
  for (const question of items) {
    const list = byCategory.get(question.category) ?? [];
    list.push({ ...question, categoryPosition: list.length });
    byCategory.set(question.category, list);
  }

  const remaining = new Map(
    [...byCategory].map(([category, list]) => [category, list.slice()] as const)
  );
  const lastPos = new Map<string, number>();
  const lastSeen = new Map<string, number>();
  const output: TapQuestion[] = [];
  let lastCat: string | null = null;
  let run = 0;
  let step = 0;

  while (true) {
    const eligible: Array<{
      cat: string;
      arr: Array<TapQuestion & { categoryPosition: number }>;
      validIndices: number[];
      lastSeen: number;
    }> = [];

    for (const [cat, arr] of remaining) {
      if (!arr.length) continue;
      if (cat === lastCat && run >= RULES.categoryMaxRun) continue;
      const prior = lastPos.get(cat);
      const validIndices: number[] = [];
      for (let i = 0; i < arr.length; i++) {
        const item = arr[i]!;
        if (prior === undefined || Math.abs(item.categoryPosition - prior) >= RULES.categoryMinGap) {
          validIndices.push(i);
        }
      }
      if (!validIndices.length) continue;
      eligible.push({
        cat,
        arr,
        validIndices,
        lastSeen: lastSeen.get(cat) ?? -100000,
      });
    }

    if (!eligible.length) break;
    eligible.sort((a, b) => a.lastSeen - b.lastSeen);
    const oldest = eligible[0]!.lastSeen;
    const band = eligible.filter((item) => item.lastSeen <= oldest + 2);
    const chosen = band[Math.floor(Math.random() * band.length)]!;
    const pick = chosen.validIndices[Math.floor(Math.random() * chosen.validIndices.length)]!;
    const question = chosen.arr.splice(pick, 1)[0]!;
    output.push(presentQuestion(question));
    lastPos.set(chosen.cat, question.categoryPosition);
    lastSeen.set(chosen.cat, step);
    step += 1;
    if (chosen.cat === lastCat) run += 1;
    else {
      lastCat = chosen.cat;
      run = 1;
    }
  }

  return output;
}
