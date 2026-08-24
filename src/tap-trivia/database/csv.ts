import type { TapDifficulty, TapQuestion } from "@/tap-trivia/types";
import { detectQuestionType } from "./question-types";

export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      field = "";
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
    } else if (ch !== "\r") {
      field += ch;
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    if (row.some((value) => value !== "")) rows.push(row);
  }
  if (!rows.length) return [];
  const header = (rows.shift() ?? []).map((name, index) =>
    index === 0 ? name.replace(/^\uFEFF/, "") : name
  );
  return rows.map((values) => {
    const out: Record<string, string> = {};
    header.forEach((key, index) => {
      out[key] = values[index] ?? "";
    });
    return out;
  });
}

function asDifficulty(value: string): TapDifficulty | null {
  const key = value.trim().toLowerCase();
  if (key === "easy" || key === "medium" || key === "hard") return key;
  return null;
}

export function normalizeRow(row: Record<string, string>): TapQuestion | null {
  const sourceQuestion = (row.question || "").trim();
  const answer = (row.answers || row.answer || "").trim();
  const difficulty = asDifficulty(row.difficulty || "");
  if (!sourceQuestion || !answer || !difficulty) return null;
  const options = [row.option_a, row.option_b, row.option_c, row.option_d]
    .map((value) => (value || "").trim())
    .filter(Boolean);
  return {
    id: (row.question_id || "").trim(),
    sourceQuestion,
    question: sourceQuestion,
    answer,
    category: (row.assigned_category || row.category || "General Knowledge").trim(),
    difficulty,
    type: detectQuestionType({
      answer,
      declaredType: row.type,
      options,
    }),
    options,
    source: (row.source || "Tap Trivia Question Database").trim(),
  };
}

export function normalizeCsv(text: string): TapQuestion[] {
  return parseCsv(text)
    .map(normalizeRow)
    .filter((row): row is TapQuestion => row !== null);
}
