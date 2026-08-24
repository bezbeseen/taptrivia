# SLAP 15

Party trivia from [the original SLAP 15 preview](https://raw.githack.com/bezbeseen/weddingmarking/slap-15-app/slap-15/preview.html). The current game-show build is the Next.js app. `local/slap-15.html` is the older table UI.

One player reads. The others compete. First slap gets the first answer. First to 15 net points (or whatever you set) wins.

## How it plays

- Pick a question level, 3–8 players, and the winning score.
- The reader shows the question, then the answer.
- **+1 Correct** or **Wrong** takes over the screen with the result. A correct answer hands the card to the next reader.
- Almost every tap has a cartoon sound — kazoos, honks, slide whistles, sad trombones, and a ta-da when someone wins.
- Wrong answers escalate per player: first miss −1, second −2, third −3, and so on.
- The reader cannot score on their own question.
- If nobody knows, it becomes multiple choice. The correct-choice screen lists the other players so you can tap who scored.
- **Next Reader** rotates the card. **Undo Last** reverses the last score. **Reset Game** starts a new night but keeps each level’s question position.

Question progress is stored in this browser by level.

## Question library

A few thousand unique questions, written to be read out loud. Easy, Medium, Hard, and Smart AF are real difficulty bands — Mix weaves all four together.

Sources:

- A curated party pack of short-answer trivia
- [The Trivia API](https://the-trivia-api.com)
- [Open Trivia Database](https://opentdb.com)
- The original SLAP 15 bank, cleaned up

Rebuild the merged file with:

```bash
python3 scripts/build-question-bank.py
```

That writes `src/data/questions.json`. Multiple-choice steal rounds prefer each question’s own wrong answers, then other answers from the same category.

## Local copy (no server required)

The original trivia-only build also lives in [`local/`](local/README.md) if you want a single HTML file.

- Open **`local/slap-15.html`** in a browser — one file, question bank included.
- Or serve the `local/` folder if you want the original `preview.html` split.

## Public URL

Share this while Marc is getting git working:

**https://htmlpreview.github.io/?https://github.com/bezbeseen/taptrivia/blob/main/local/slap-15.html**

For a cleaner permanent link, turn on GitHub Pages:

1. Open [Pages settings](https://github.com/bezbeseen/taptrivia/settings/pages)
2. Under **Build and deployment**, set Source to **GitHub Actions**
3. Open [Actions](https://github.com/bezbeseen/taptrivia/actions) and run **GitHub Pages** if it does not start on its own

Then the game is at **https://bezbeseen.github.io/taptrivia/**

## Next.js app

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127). On an iPad, Add to Home Screen keeps it full-bleed for the table.

```bash
npm run build
npm start
```

## Stack

Next.js, TypeScript, Tailwind CSS, and shadcn/ui.
