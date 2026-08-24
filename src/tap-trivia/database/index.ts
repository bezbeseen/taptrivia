export {
  QUESTION_TYPES,
  ALL_TYPES_ON,
  detectQuestionType,
  filterByTypes,
  countByType,
} from "./question-types";
export {
  formatOpen,
  formatTrueFalse,
  formatMultipleChoice,
  presentQuestion,
} from "./multiple-choice";
export { parseCsv, normalizeRow, normalizeCsv } from "./csv";
export { TAP_CATEGORIES, buildQueue } from "./queue";
export { fromBundled, allBundledQuestions } from "./bundled";
export {
  databaseSize,
  databaseSource,
  questionTypeCounts,
  importCsvFile,
  clearSavedCsv,
  initDatabase,
} from "./store";

import type { TapDifficulty, TapQuestion, TypeFilter } from "@/tap-trivia/types";
import { ALL_TYPES_ON, filterByTypes } from "./question-types";
import { buildQueue } from "./queue";
import { initDatabase } from "./store";

export async function loadTapQueue(options: {
  difficulty: TapDifficulty | "";
  types?: TypeFilter;
  onStatus?: (message: string) => void;
}): Promise<TapQuestion[]> {
  if (!options.difficulty) throw new Error("Choose a difficulty.");
  const data = await initDatabase(options.onStatus);
  const matches = filterByTypes(
    data.filter((question) => question.difficulty === options.difficulty),
    options.types ?? ALL_TYPES_ON
  );
  if (!matches.length) {
    throw new Error("No questions match that difficulty and type mix.");
  }
  options.onStatus?.(
    `Randomizing ${matches.length.toLocaleString()} questions across categories...`
  );
  const queue = buildQueue(matches);
  if (!queue.length) throw new Error("Could not build a valid randomized question queue.");
  options.onStatus?.(`${queue.length.toLocaleString()} questions ready across all categories.`);
  return queue;
}
