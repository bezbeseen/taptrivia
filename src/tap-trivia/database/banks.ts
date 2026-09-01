import type { BankId } from "@/tap-trivia/types";

export const BANKS: {
  id: BankId;
  label: string;
  hint: string;
}[] = [
  {
    id: "table",
    label: "This build",
    hint: "The spoken-aloud table library. Open answers, with No one knows if the table is stumped.",
  },
  {
    id: "marc",
    label: "Marc pack",
    hint: "The same library packaged in Marc’s CSV columns, so A–D is on the card from the start.",
  },
  {
    id: "upload",
    label: "Your CSV",
    hint: "A Tap Trivia CSV saved in this browser. Upload Tap_Trivia_Question_Database.csv to replace it.",
  },
];

const BANK_STORAGE = "tap-trivia-selected-bank-v1";

export function readSavedBank(): BankId {
  if (typeof window === "undefined") return "table";
  const value = window.localStorage.getItem(BANK_STORAGE);
  if (value === "table" || value === "marc" || value === "upload") return value;
  return "table";
}

export function writeSavedBank(bank: BankId): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(BANK_STORAGE, bank);
}
