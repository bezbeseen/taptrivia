import type { RunSummary } from "@/lib/game";

const KEY = "slap-15-records-v1";
const MAX_SAVED = 12;

export type StoredRecords = {
  runs: RunSummary[];
  bestScore: number;
  bestCombo: number;
  farthestRound: number;
};

export const EMPTY_RECORDS: StoredRecords = {
  runs: [],
  bestScore: 0,
  bestCombo: 0,
  farthestRound: 0,
};

export type StorageResult =
  | { ok: true; data: StoredRecords }
  | { ok: false; data: StoredRecords; error: string };

export const SERVER_RECORDS: StorageResult = { ok: true, data: EMPTY_RECORDS };
const CHANGE_EVENT = "slap-15-records";

let snapshot: StorageResult = SERVER_RECORDS;
let didRead = false;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function parseRecords(raw: string): StoredRecords {
  const parsed = JSON.parse(raw) as Partial<StoredRecords>;
  return {
    runs: Array.isArray(parsed.runs) ? parsed.runs : [],
    bestScore: Number(parsed.bestScore) || 0,
    bestCombo: Number(parsed.bestCombo) || 0,
    farthestRound: Number(parsed.farthestRound) || 0,
  };
}

function readFromStorage(): StorageResult {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      return { ok: true, data: EMPTY_RECORDS };
    }
    return { ok: true, data: parseRecords(raw) };
  } catch {
    return {
      ok: false,
      data: EMPTY_RECORDS,
      error: "This browser blocked local storage, so nights will not be saved.",
    };
  }
}

function remember(next: StorageResult): StorageResult {
  snapshot = next;
  didRead = true;
  return snapshot;
}

function notify() {
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function loadRecords(): StorageResult {
  if (!isBrowser()) return SERVER_RECORDS;
  return remember(readFromStorage());
}

export function getRecordsSnapshot(): StorageResult {
  if (!isBrowser()) return SERVER_RECORDS;
  if (!didRead) return loadRecords();
  return snapshot;
}

export function getServerRecordsSnapshot(): StorageResult {
  return SERVER_RECORDS;
}

export function subscribeRecords(onStoreChange: () => void) {
  const handler = () => {
    loadRecords();
    onStoreChange();
  };
  window.addEventListener("storage", handler);
  window.addEventListener(CHANGE_EVENT, handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(CHANGE_EVENT, handler);
  };
}

export function saveRun(run: RunSummary): StorageResult {
  const current = loadRecords();
  if (!current.ok) return current;

  const runs = [run, ...current.data.runs].slice(0, MAX_SAVED);
  const next: StoredRecords = {
    runs,
    bestScore: Math.max(current.data.bestScore, run.score),
    bestCombo: Math.max(current.data.bestCombo, run.maxCombo),
    farthestRound: Math.max(current.data.farthestRound, run.roundsCompleted),
  };

  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
    const saved = remember({ ok: true, data: next });
    notify();
    return saved;
  } catch {
    const failed = remember({
      ok: false,
      data: next,
      error: "Could not write records. The night still counts on this screen.",
    });
    notify();
    return failed;
  }
}

export function clearRecords(): StorageResult {
  try {
    window.localStorage.removeItem(KEY);
    const cleared = remember({ ok: true, data: EMPTY_RECORDS });
    notify();
    return cleared;
  } catch {
    const failed = remember({
      ok: false,
      data: EMPTY_RECORDS,
      error: "Could not clear records in this browser.",
    });
    notify();
    return failed;
  }
}
