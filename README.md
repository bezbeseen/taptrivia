# Tap Trivia

Pulled from [github.com/bezbeseen/taptrivia](https://github.com/bezbeseen/taptrivia) — Marc’s Tap Trivia build, now a Next.js table app.

One player reads (or a host asks). The others compete. Correct is +1. Wrong is −1.

## How it plays

- Easy, Medium, or Hard.
- **Reader rotation** or **Host mode**.
- 2–6 players. Default winning score depends on the table size (15 / 11 / 9 / 8 / 7).
- All 12 categories are used. A category never appears twice in a row, and a repeat from the same category is spaced by at least 50 questions in that category’s pool.
- Upload `Tap_Trivia_Question_Database.csv` to use Marc’s database (saved in this browser). If you skip that, the bundled library is used.

## Run it

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127).

```bash
npm run build
npm start
```

Marc’s original files are still in the repo root: `index.html`, `question-engine-v2.js`.

## Isolated layers

These four pieces are separate so one can change without rewriting the others:

- **UI** — `src/tap-trivia/ui/` (setup panels + table screen)
- **Gameplay** — `src/tap-trivia/gameplay.ts` (show/hide the card, score, next question)
- **Rules** — `src/tap-trivia/rules.ts` (+1 / −1, who can score, win target)
- **Database** — `src/tap-trivia/database/`
  - `question-types.ts` — open, true/false, multiple choice
  - `multiple-choice.ts` — how A–D and True/False are presented
  - CSV parse, IndexedDB store, and the category queue
