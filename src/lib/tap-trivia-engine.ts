import { loadQuestionBanks, type TriviaQuestion } from "@/lib/questions";

export type TapDifficulty = "easy" | "medium" | "hard";
export type TapMode = "rotation" | "host";
export type TapQuestionType = "boolean" | "multiple" | "open";

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

export const DEFAULT_WIN_SCORE: Record<number, number> = {
  2: 15,
  3: 11,
  4: 9,
  5: 8,
  6: 7,
};

export type TapQuestion = {
  id: string;
  sourceQuestion: string;
  question: string;
  answer: string;
  category: string;
  difficulty: TapDifficulty;
  type: TapQuestionType;
  options: string[];
  source: string;
};

const DATABASE_URL = "/Tap_Trivia_Question_Database.csv";
const DB_NAME = "tapTriviaQuestionDatabase";
const DB_STORE = "files";
const DB_KEY = "final-question-database-v1";

function shuffle<T>(items: T[]): T[] {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

function parseCsv(text: string): Record<string, string>[] {
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

function normalizeRow(row: Record<string, string>): TapQuestion | null {
  const sourceQuestion = (row.question || "").trim();
  const answer = (row.answers || row.answer || "").trim();
  const difficulty = asDifficulty(row.difficulty || "");
  if (!sourceQuestion || !answer || !difficulty) return null;
  const category = (row.assigned_category || row.category || "General Knowledge").trim();
  const options = [row.option_a, row.option_b, row.option_c, row.option_d]
    .map((value) => (value || "").trim())
    .filter(Boolean);
  const declared = (row.type || "").trim().toLowerCase();
  const answerLower = answer.toLowerCase();
  const type: TapQuestionType =
    answerLower === "true" || answerLower === "false"
      ? "boolean"
      : declared === "multiple" || options.length === 4
        ? "multiple"
        : declared === "boolean"
          ? "boolean"
          : "open";
  return {
    id: (row.question_id || "").trim(),
    sourceQuestion,
    question: sourceQuestion,
    answer,
    category,
    difficulty,
    type,
    options,
    source: (row.source || "Tap Trivia Question Database").trim(),
  };
}

function normalizeCsv(text: string): TapQuestion[] {
  return parseCsv(text).map(normalizeRow).filter((row): row is TapQuestion => row !== null);
}

function formatForGame(question: TapQuestion): TapQuestion {
  if (question.type === "boolean") {
    return {
      ...question,
      options: ["True", "False"],
      question: `[${question.category}]\nTrue or False\n${question.sourceQuestion}`,
    };
  }
  if (question.type === "multiple" && question.options.length === 4) {
    const opts = shuffle(question.options);
    return {
      ...question,
      options: opts,
      question: `[${question.category}]\nThis is a multiple choice question.\n${question.sourceQuestion}\n${opts
        .map((opt, index) => `${String.fromCharCode(65 + index)}. ${opt}`)
        .join("\n")}`,
    };
  }
  return {
    ...question,
    question: `[${question.category}]\n${question.sourceQuestion}`,
  };
}

function buildQueue(items: TapQuestion[]): TapQuestion[] {
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
      if (cat === lastCat && run >= 2) continue;
      const prior = lastPos.get(cat);
      const validIndices: number[] = [];
      for (let i = 0; i < arr.length; i++) {
        const item = arr[i]!;
        if (prior === undefined || Math.abs(item.categoryPosition - prior) >= 50) {
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
    output.push(formatForGame(question));
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

function fromBundled(difficulty: TapDifficulty): TapQuestion[] {
  const banks = loadQuestionBanks();
  const pool: TriviaQuestion[] = banks[difficulty] ?? [];
  return pool.map((item, index) => {
    const options = [item.answer, ...(item.distractors ?? [])]
      .map((value) => value.trim())
      .filter(Boolean)
      .slice(0, 4);
    const type: TapQuestionType =
      item.answer.toLowerCase() === "true" || item.answer.toLowerCase() === "false"
        ? "boolean"
        : options.length === 4
          ? "multiple"
          : "open";
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

async function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("This browser does not support local database storage."));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error || new Error("Could not open local database storage."));
  });
}

async function readStoredCsv(): Promise<string | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, "readonly");
      const request = tx.objectStore(DB_STORE).get(DB_KEY);
      request.onsuccess = () => resolve((request.result as string | undefined) ?? null);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

async function writeStoredCsv(text: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readwrite");
    tx.objectStore(DB_STORE).put(text, DB_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("Could not save the question database."));
  });
}

let database: TapQuestion[] | null = null;
let loadingPromise: Promise<TapQuestion[]> | null = null;
let sourceLabel = "bundled library";

export function databaseSize(): number {
  return database?.length ?? 0;
}

export function databaseSource(): string {
  return sourceLabel;
}

export async function importCsvFile(
  file: File,
  onStatus?: (message: string) => void
): Promise<number> {
  onStatus?.(`Reading ${file.name}...`);
  const text = await file.text();
  const rows = normalizeCsv(text);
  if (!rows.length) {
    throw new Error("That file does not contain usable Tap Trivia questions.");
  }
  await writeStoredCsv(text);
  database = rows;
  sourceLabel = file.name;
  onStatus?.(`${database.length} questions saved on this browser.`);
  return database.length;
}

export async function initDatabase(
  onStatus?: (message: string) => void
): Promise<TapQuestion[]> {
  if (database) return database;
  if (loadingPromise) return loadingPromise;
  loadingPromise = (async () => {
    onStatus?.("Loading Tap Trivia question database...");
    const stored = await readStoredCsv();
    if (stored) {
      const rows = normalizeCsv(stored);
      if (rows.length) {
        database = rows;
        sourceLabel = "saved CSV";
        onStatus?.(`${database.length} questions loaded from this browser.`);
        return database;
      }
    }
    try {
      const response = await fetch(DATABASE_URL, { cache: "no-store" });
      if (response.ok) {
        const text = await response.text();
        const rows = normalizeCsv(text);
        if (rows.length) {
          database = rows;
          sourceLabel = "Tap Trivia CSV";
          try {
            await writeStoredCsv(text);
          } catch {
            /* ignore */
          }
          onStatus?.(`${database.length} questions loaded from the Tap Trivia database.`);
          return database;
        }
      }
    } catch {
      /* fall through to bundled library */
    }
    const bundled = [
      ...fromBundled("easy"),
      ...fromBundled("medium"),
      ...fromBundled("hard"),
    ];
    database = bundled;
    sourceLabel = "bundled library";
    onStatus?.(
      `${database.length} bundled questions ready. Upload Tap_Trivia_Question_Database.csv anytime to switch.`
    );
    return database;
  })();
  try {
    return await loadingPromise;
  } finally {
    loadingPromise = null;
  }
}

export async function loadTapQueue(options: {
  difficulty: TapDifficulty | "";
  onStatus?: (message: string) => void;
}): Promise<TapQuestion[]> {
  if (!options.difficulty) throw new Error("Choose a difficulty.");
  const data = await initDatabase(options.onStatus);
  const matches = data.filter((question) => question.difficulty === options.difficulty);
  if (!matches.length) {
    throw new Error("No questions are available for that difficulty.");
  }
  options.onStatus?.(
    `Randomizing ${matches.length.toLocaleString()} questions across categories...`
  );
  const queue = buildQueue(matches);
  if (!queue.length) throw new Error("Could not build a valid randomized question queue.");
  options.onStatus?.(`${queue.length.toLocaleString()} questions ready across all categories.`);
  return queue;
}
