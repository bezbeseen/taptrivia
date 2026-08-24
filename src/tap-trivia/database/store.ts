import type { TapQuestion, TapQuestionType } from "@/tap-trivia/types";
import { allBundledQuestions } from "./bundled";
import { normalizeCsv } from "./csv";
import { countByType } from "./question-types";

const DATABASE_URL = "/Tap_Trivia_Question_Database.csv";
const DB_NAME = "tapTriviaQuestionDatabase";
const DB_STORE = "files";
const DB_KEY = "final-question-database-v1";

let database: TapQuestion[] | null = null;
let loadingPromise: Promise<TapQuestion[]> | null = null;
let sourceLabel = "bundled library";

export function databaseSize(): number {
  return database?.length ?? 0;
}

export function databaseSource(): string {
  return sourceLabel;
}

export function questionTypeCounts(): Record<TapQuestionType, number> {
  return countByType(database ?? []);
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

export async function clearSavedCsv(): Promise<void> {
  database = allBundledQuestions();
  sourceLabel = "bundled library";
  if (typeof indexedDB === "undefined") return;
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(DB_STORE, "readwrite");
      tx.objectStore(DB_STORE).delete(DB_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    /* bundled fallback still applies */
  }
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
    database = allBundledQuestions();
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
