# Tap Trivia — question bank and how multiple choice is derived

Use this folder as the source of truth for another revision of the game. The live bank is `taptrivia-questions.json` (10,115 unique spoken-aloud items). The derived files already apply this build’s fill rules so you do not have to re-invent distractors.

## Files

| File | What it is |
| --- | --- |
| `taptrivia-questions.json` | Raw bank used by this build. One object per question. |
| `taptrivia-questions-with-choices.csv` | Same bank, plus cleaned distractors, type labels, and the four A–D choices this game would show after **No one knows**. |
| `taptrivia-questions-with-choices.json` | Same derived rows as the CSV. |
| `sample-12-questions.json` | Tiny example of the derived shape. |
| `HOW_MULTIPLE_CHOICE.md` | This spec. |

## Source record shape

```json
{
  "question": "What is the capital of France?",
  "answer": "Paris",
  "difficulty": "easy",
  "category": "Geography",
  "distractors": ["Lyon", "Marseille", "Nice"]
}
```

Rules when loading:

- Trim `question` and `answer`. Drop the row if either is empty.
- Deduplicate by `question` lowercased.
- `difficulty` is `easy` | `medium` | `hard` | `smart`. This build’s table UI only queues **easy / medium / hard**. `smart` stays in the JSON (750 items) but is not in the default table pool. If you keep Smart AF, treat `smart` as its own hard tier.
- `category` falls back to `"General Knowledge"` if blank.
- Distractors: keep up to **3**, unique, case-insensitive; skip blanks; skip the correct answer; skip any string longer than **48** characters.

This JSON has **no true/false items**. Counts in this export: easy 2170, medium 4365, hard 2830, smart 750. About 9186 rows already have 3 usable distractors. About 929 are short of 3 and stay open unless you fill them.

## Question types

Detect type in this order:

1. If `answer` (trimmed, lowercased) is `"true"` or `"false"`, type is **boolean**. Options are always `True` then `False`. Never show **No one knows**.
2. Else if the chosen bank is **Marc pack** and `[answer, ...distractors]` has **4** strings after trim, type is **multiple**. Show A–D on the card from the start. Never show **No one knows**.
3. Else type is **open**. Reader says the question out loud. No letters on the card until someone hits **No one knows**.

### This build (bank id `table`)

Every non-boolean item stays **open**, even when 3 distractors exist. Distractors are stored but hidden. A–D appear only after **No one knows**, built by `buildPlayableChoices` below.

### Marc pack (bank id `marc`)

Same JSON. If the item has a correct answer plus 3 distractors, bake `options = [answer, ...distractors].slice(0, 4)` and mark type **multiple**. Shuffle those four only when presenting the card. If fewer than 3 distractors, leave it **open**.

## How four choices are derived from an open question

This is the algorithm in `src/tap-trivia/database/choices.ts`. Call it when type is `multiple`, **or** when type is `open` and **No one knows** was pressed. Do not call it for boolean.

Start with the correct `answer`. Then fill until you have **3 distractors** (4 options total):

1. **Written distractors** from the record, in order, after the load-time cleaning above.
2. If still short: other questions’ **answers** in the **same category**, shuffled with a seeded RNG. Seed is FNV-1a of `question + "cat"`.
3. If still short: **any** other question’s answer from the pool, shuffled. Seed is FNV-1a of `question + answer`.
4. If still short: fallbacks in order: `"Red herring"`, `"Close, but no"`, `"Not this one"`, `"A wild guess"`.
5. Never reuse a string that matches the correct answer or an already chosen option (case-insensitive).
6. Shuffle the final 4 with seed FNV-1a of `answer + "mc"`.

In the live app the pool is the **current difficulty bank**. The derived CSV/JSON in this zip fill from the **full unique bank** so a ChatGPT rebuild has complete A–D text without reimplementing the filler.

### Seeded shuffle (LCG, same as the app)

```js
function seededShuffle(items, seed) {
  const arr = items.slice();
  let s = seed >>> 0;
  const rnd = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function hashSeed(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
```

### Fill function (copy this)

```js
function buildPlayableChoices(question, pool) {
  const answer = question.answer.trim();
  const seen = new Set([answer.toLowerCase()]);
  const distractors = [];

  for (const text of question.distractors || []) {
    const value = String(text).trim();
    if (!value || seen.has(value.toLowerCase())) continue;
    seen.add(value.toLowerCase());
    distractors.push(value);
    if (distractors.length >= 3) break;
  }

  const sameCategory = seededShuffle(
    pool.filter((item) => item.category === question.category),
    hashSeed(question.question + "cat")
  );
  const rest = seededShuffle(pool, hashSeed(question.question + question.answer));
  for (const item of [...sameCategory, ...rest]) {
    if (distractors.length >= 3) break;
    const value = item.answer.trim();
    if (!value || seen.has(value.toLowerCase())) continue;
    seen.add(value.toLowerCase());
    distractors.push(value);
  }

  const fallback = ["Red herring", "Close, but no", "Not this one", "A wild guess"];
  while (distractors.length < 3) {
    const extra = fallback[distractors.length] || `Option ${distractors.length + 2}`;
    if (seen.has(extra.toLowerCase())) break;
    seen.add(extra.toLowerCase());
    distractors.push(extra);
  }

  return seededShuffle(
    [{ text: answer, correct: true }, ...distractors.map((text) => ({ text, correct: false }))],
    hashSeed(question.answer + "mc")
  );
}
```

## How the table uses those choices

- **Open:** reader asks; players shout; host/reader taps who got it (+1) or who missed it (−1). **No one knows** is allowed. After it, the four letters appear. The question stays the same; only the answer format changes.
- **Multiple (Marc pack, or open after No one knows):** letters A–D are tappable. Wrong letter → **Who missed it?** (−1), that letter stays out, others remain. Correct letter → **Who got it?** (+1). Do not auto-advance until the overlay is dismissed.
- **Boolean:** True / False on the card. Same miss/correct overlay. No **No one knows**.
- Scoring is **+1 / −1**, not escalating slap penalties. In reader-rotation mode the current reader cannot score. Host mode: anyone can score.
- Win target by player count: 2→15, 3→11, 4→9, 5→8, 6→7.

## Derived CSV columns

- `question`, `answer`, `difficulty`, `original_difficulty`, `category`
- `this_build_type` — almost always `open` in this JSON
- `marc_pack_type` — `multiple` when 3 written distractors exist, else `open`
- `written_distractor_1` / `_2` / `_3` — cleaned source distractors (may be blank)
- `option_a` … `option_d` — the four choices after the fill + shuffle above
- `correct_letter` — A/B/C/D matching `answer`

If you want Marc-pack native options instead of the shuffled fill, use `[answer, written_distractor_1, written_distractor_2, written_distractor_3]` and shuffle at present-time only.

## Prompt you can paste into ChatGPT

> Rebuild this party trivia table game. Use the attached question bank. Every item is an open spoken question with a short answer. Multiple choice is NOT a separate database — derive four options with the algorithm in HOW_MULTIPLE_CHOICE.md (written distractors first, then same-category answers, then any answers, then the four fallback strings, then seeded shuffle). In “this build” mode keep questions open until No one knows, then show A–D. In Marc-pack mode, if three distractors already exist, show A–D from the start. True/False only when the answer is true/false. Correct +1, wrong −1. Do not invent new questions unless I ask.

## Do not do

- Do not treat missing distractors as a reason to drop the question. Fill them.
- Do not show **No one knows** on true/false or on native multiple choice.
- Do not keep the correct answer in a fixed letter. Shuffle.
- Do not use SLAP 15 escalating miss penalties or mini-games.
