"use client";

import { PlayerAvatar } from "@/components/player-avatar";
import type { TapTriviaGame } from "@/hooks/use-tap-trivia";
import { canPlayerScore } from "@/tap-trivia/rules";

export function RoundOverlay({ game }: { game: TapTriviaGame }) {
  const result = game.roundResult;
  if (!result) return null;

  const pickingWinner = result.kind === "mc-correct";
  const tone = result.won ? "win" : result.kind === "correct" || result.kind === "mc-correct"
    ? "correct"
    : "wrong";
  const headline = result.won
    ? "WINS!"
    : result.kind === "correct" || result.kind === "mc-correct"
      ? "CORRECT"
      : "WRONG";
  const deltaText =
    result.delta > 0 ? `+${result.delta}` : result.delta < 0 ? String(result.delta) : null;
  const dismiss = result.won ? game.resetGame : game.dismissRoundResult;

  return (
    <div className={`slap15 round-open ${tone}`}>
      <header className="result-header">
        <div>
          <div className="logo brand">
            <span className="logo-slap">TAP</span>
            <span className="logo-trivia">TRIVIA</span>
          </div>
          <div className="result-reader">
            {pickingWinner
              ? "Tap who scored"
              : result.won
                ? "First to the winning score"
                : result.kind === "correct" && game.nextName
                  ? `${game.nextName} reads next`
                  : game.readerName
                    ? `${game.readerName} is still reading`
                    : "Tap Trivia"}
          </div>
        </div>
        <span className="result-tap">
          {pickingWinner ? "Reader sits out" : "Tap to continue"}
        </span>
      </header>
      <div
        className={`round-result ${tone}${pickingWinner ? " picking" : ""}`}
        role={pickingWinner ? undefined : "button"}
        tabIndex={pickingWinner ? undefined : 0}
        onClick={pickingWinner ? undefined : dismiss}
        onKeyDown={
          pickingWinner
            ? undefined
            : (event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  dismiss();
                }
              }
        }
      >
        {result.playerIndex !== null ? (
          <PlayerAvatar id={result.playerIndex} size={120} title={result.name} />
        ) : null}
        <div className="round-name">{result.name}</div>
        <div className="round-verdict">{headline}</div>
        {deltaText ? <div className="round-delta">{deltaText}</div> : null}
        {result.playerIndex !== null ? (
          <div className="round-score">Score {result.score}</div>
        ) : null}
        {result.answer ? (
          <div className="round-answer">
            <span>Answer</span>
            {result.answer}
          </div>
        ) : result.kind === "wrong" ? (
          <div className="round-hint">Answer stays hidden. Someone else can steal.</div>
        ) : result.kind === "mc-wrong" ? (
          <div className="round-hint">That choice is out. Pick another.</div>
        ) : null}
        {result.won ? (
          <div className="round-hint">First to the winning score. New night?</div>
        ) : null}
        {pickingWinner ? (
          <div className="who-got-it">
            <div className="who-got-it-label">Who got it?</div>
            <div className="who-got-it-list">
              {game.names.map((name, index) => {
                if (!canPlayerScore(game.mode, game.state.reader, index)) return null;
                return (
                  <button
                    key={`${name}-${index}`}
                    type="button"
                    className="who-got-it-player"
                    onClick={() => game.markScore(index, 1)}
                  >
                    <PlayerAvatar id={index} size={48} title={name} />
                    <span className="who-got-it-name">{name}</span>
                    <span className="who-got-it-score">
                      {game.state.scores[index] ?? 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <span className="round-continue">
            {result.continueLabel}
            {result.kind === "correct" && !result.won && game.nextName ? (
              <span className="btn-sub">{game.nextName}&apos;s turn</span>
            ) : null}
          </span>
        )}
      </div>
    </div>
  );
}
