"use client";

import { PlayerAvatar } from "@/components/player-avatar";
import type { TapTriviaGame } from "@/hooks/use-tap-trivia";
import { QUESTION_TYPES } from "@/tap-trivia/database";
import { RULE_COPY } from "@/tap-trivia/rules";

export function TableScreen({ game }: { game: TapTriviaGame }) {
  const question = game.currentQuestion;
  const typeLabel = question
    ? QUESTION_TYPES.find((item) => item.id === question.type)?.label
    : null;
  const turnHint = game.state.winner !== null
    ? `${game.names[game.state.winner]} just took the game.`
    : !game.state.questionVisible
      ? "Tap Show Question when you're ready."
      : game.state.answerVisible
        ? "Mark who scored, then keep going."
        : "Read it out. Then reveal the answer.";

  return (
    <>
      <section className="turn-banner">
        <PlayerAvatar
          id={game.mode === "host" ? 3 : game.state.reader}
          size={88}
          title={game.readerName}
        />
        <div className="turn-copy">
          <div className="turn-kicker">
            {game.state.winner !== null
              ? "Winner"
              : game.mode === "host"
                ? "Hosting"
                : "Now reading"}
          </div>
          <div className="turn-name">{game.readerName}</div>
          <div className="turn-hint">{turnHint}</div>
        </div>
      </section>

      {game.state.answerVisible && question ? (
        <section className="score-strip" aria-live="polite">
          <div className="qmeta">
            {question.category}
            {typeLabel ? ` · ${typeLabel}` : ""} · Answer
          </div>
          <div className="score-strip-answer">{question.answer}</div>
        </section>
      ) : game.state.questionVisible ? (
        <section className="question-panel" aria-live="polite">
          <div className="qmeta">
            {question
              ? `${question.difficulty} · ${question.category}${typeLabel ? ` · ${typeLabel}` : ""}`
              : "Ready"}
          </div>
          <div className="qtext tap-qtext">
            {question?.sourceQuestion ?? "No question available."}
          </div>
          {(question?.type === "multiple" || question?.type === "boolean") &&
          question.options.length ? (
            <div className="choices">
              {question.options.map((choice, index) => (
                <div key={`${choice}-${index}`} className="choice">
                  <span className="choice-letter">
                    {String.fromCharCode(65 + index)}
                  </span>
                  {choice}
                </div>
              ))}
            </div>
          ) : null}
          <div className="qbuttons">
            <button
              type="button"
              className="primary"
              onClick={game.showAnswer}
              disabled={game.state.winner !== null}
            >
              Reveal answer
            </button>
          </div>
        </section>
      ) : (
        <div className="next-card">
          <button
            type="button"
            className="primary"
            onClick={game.showQuestion}
            disabled={game.state.winner !== null || !question}
          >
            Show question
          </button>
        </div>
      )}

      <div className="players">
        {game.names.map((name, index) => {
          const isReader = game.mode === "rotation" && index === game.state.reader;
          const eligible = !isReader && game.state.winner === null;
          return (
            <section
              key={`${name}-${index}`}
              className={isReader ? "card reading" : "card"}
            >
              {isReader ? <div className="reading-pill">Reading</div> : null}
              <PlayerAvatar id={index} size={72} title={name} />
              <div className="name">{name}</div>
              <div className="score">{game.state.scores[index] ?? 0}</div>
              {isReader ? (
                <div className="seat-note">Sit this one out. You&apos;re reading.</div>
              ) : (
                <div className="buttons">
                  <button
                    type="button"
                    className={eligible ? "correct" : "correct disabled"}
                    disabled={!eligible}
                    onClick={() => game.markScore(index, 1)}
                  >
                    Correct
                    <span className="btn-sub">+1 point</span>
                  </button>
                  <button
                    type="button"
                    className={eligible ? "wrong" : "wrong disabled"}
                    disabled={!eligible}
                    onClick={() => game.markScore(index, -1)}
                  >
                    Wrong
                    <span className="btn-sub">−1 point</span>
                  </button>
                </div>
              )}
            </section>
          );
        })}
      </div>

      {game.state.winner !== null ? (
        <div className="winner">
          {game.names[game.state.winner]} wins with{" "}
          {game.state.scores[game.state.winner]} points!
        </div>
      ) : null}

      <div className="bottom">
        <button
          type="button"
          className="primary next"
          onClick={game.nextReader}
          disabled={!!game.state.winner}
        >
          {game.mode === "host" ? "Next question" : "Next reader"}
          {game.mode === "rotation" && game.nextName ? (
            <span className="btn-sub">{game.nextName}&apos;s turn</span>
          ) : null}
        </button>
        <button
          type="button"
          onClick={game.undo}
          disabled={game.historyLength === 0}
        >
          Undo last
        </button>
        <button type="button" onClick={game.resetGame}>
          Reset game
        </button>
      </div>

      <div className="status" aria-live="polite">
        {game.status}
      </div>
      <div className="rules">{RULE_COPY}</div>
    </>
  );
}
