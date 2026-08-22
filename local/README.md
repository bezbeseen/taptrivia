# SLAP 15 — local copy

This is a standalone copy of the original [SLAP 15 preview](https://raw.githack.com/bezbeseen/weddingmarking/slap-15-app/slap-15/preview.html). It does not need GitHub or a deploy.

## Open it

**Easiest:** open `slap-15.html` in a browser. Everything is in that one file.

From this folder with a tiny server (needed for `preview.html`, which loads the other files):

```bash
npx --yes serve .
```

Then open the URL it prints and choose `slap-15.html` or `preview.html`.

## Files

| File | What it is |
| --- | --- |
| `slap-15.html` | Full game in one file. Use this. |
| `preview.html` | Original loader. Needs a local server. |
| `sounds.js` | Cartoon sound pack for every tap. |
| `app.html` | Original shell and scoring. |
| `questions-data-*.js` | Compressed question bank. |
| `questions-loader.js` | Unpacks the bank in the browser. |
