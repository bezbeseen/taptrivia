# SLAP 15

Party trivia from [the original SLAP 15 preview](https://raw.githack.com/bezbeseen/weddingmarking/slap-15-app/slap-15/preview.html).

One player reads. The others compete. First slap gets the first answer. First to 15 net points (or whatever you set) wins.

## How it plays

- Pick a question level, 3–8 players, and the winning score.
- The reader shows the question, then the answer.
- **+1 Correct** or **Wrong** takes over the screen with the result. Tap to continue.
- After a correct answer, the table plays **Hungry Hungry Hippos**: mash the hippo facing you, first to five marbles wins bragging rights. It does not change trivia scores. Skip it anytime.
- Almost every tap has a cartoon sound — kazoos, honks, slide whistles, sad trombones, and a ta-da when someone wins.
- Wrong answers escalate per player: first miss −1, second −2, third −3, and so on.
- The reader cannot score on their own question.
- **Next Reader** rotates the card. **Undo Last** reverses the last score. **Reset Game** starts a new night but keeps each level’s question position.

Question progress is stored in this browser by level.

## Local copy (no server required)

The original trivia-only build also lives in [`local/`](local/README.md) if you want a single HTML file without the hippos mini-game.

- Open **`local/slap-15.html`** in a browser — one file, question bank included.
- Or serve the `local/` folder if you want the original `preview.html` split.

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

Next.js, TypeScript, Tailwind CSS, and shadcn/ui. The question bank is the same compressed set as the original `weddingmarking` SLAP 15 build.
