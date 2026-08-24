"use client";

import { PlayerAvatar } from "@/components/player-avatar";
import { useTapTrivia } from "@/hooks/use-tap-trivia";
import { DEFAULT_WIN_SCORE, type TapDifficulty, type TapMode } from "@/lib/tap-trivia-engine";
import "@/app/slap15.css";

export function TapTriviaApp() {
  const game = useTapTrivia();
  const question = game.currentQuestion;
  const turnHint = game.state.winner !== null
    ? `${game.names[game.state.winner]} just took the game.`
    : !game.state.questionVisible
      ? "Tap Show Question when you're ready."
      : game.state.answerVisible
        ? "Mark who scored, then keep going."
        : "Read it out. Then reveal the answer.";

  return (
    <div className="slap15">
      <div className="wrap">
        <div className="top">
          <div>
            <h1 className="logo">
              <span className="logo-slap">TAP</span>
              <span className="logo-trivia">TRIVIA</span>
            </h1>
            <div className="sub">{game.subtitle}</div>
          </div>
        </div>

        {!game.setup ? (
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
        ) : null}

        {game.setup ? (
          <section className="question-panel">
            <div className="qmeta">Game setup</div>
            <div className="qtext" style={{ minHeight: 0 }}>
              Marc&apos;s Tap Trivia rules: +1 correct, −1 wrong, all 12 categories,
              no category twice in a row.
            </div>
            <div className="setup-grid">
              <div className="setup-field">
                <label htmlFor="difficulty">Difficulty</label>
                <select
                  id="difficulty"
                  value={game.difficulty}
                  onChange={(event) =>
                    game.setDifficulty(event.target.value as TapDifficulty | "")
                  }
                >
                  <option value="">Choose difficulty</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div className="setup-field">
                <label htmlFor="mode">Game mode</label>
                <select
                  id="mode"
                  value={game.mode}
                  onChange={(event) => game.setMode(event.target.value as TapMode)}
                >
                  <option value="rotation">Reader rotation</option>
                  <option value="host">Host mode</option>
                </select>
              </div>
              <div className="setup-field">
                <label htmlFor="playerCount">Number of players</label>
                <select
                  id="playerCount"
                  value={game.playerCount}
                  onChange={(event) =>
                    game.setPlayerCountSafe(Number(event.target.value))
                  }
                >
                  {[2, 3, 4, 5, 6].map((count) => (
                    <option key={count} value={count}>
                      {count}
                      {DEFAULT_WIN_SCORE[count]
                        ? ` · first to ${DEFAULT_WIN_SCORE[count]}`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="setup-field">
                <label htmlFor="winScore">Points to win</label>
                <input
                  id="winScore"
                  type="number"
                  min={1}
                  max={99}
                  inputMode="numeric"
                  value={game.winTarget}
                  onChange={(event) =>
                    game.setWinTarget(Number(event.target.value) || 1)
                  }
                />
              </div>
            </div>
            {game.mode === "host" ? (
              <div className="setup-field" style={{ marginTop: 14 }}>
                <label htmlFor="hostName">Host name</label>
                <input
                  id="hostName"
                  type="text"
                  maxLength={24}
                  value={game.hostName}
                  onChange={(event) => game.setHostName(event.target.value)}
                />
              </div>
            ) : null}
            <div className="setup-field" style={{ marginTop: 14 }}>
              <label htmlFor="databaseFile">Question database</label>
              <input
                id="databaseFile"
                type="file"
                accept=".csv,text/csv"
                disabled={game.importing}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void game.importDatabase(file);
                }}
              />
              <div className="seat-note" style={{ marginTop: 8 }}>
                {game.dbCount
                  ? `${game.dbCount.toLocaleString()} questions from the ${game.dbSource}. Upload Marc’s CSV to replace it.`
                  : "Upload Tap_Trivia_Question_Database.csv, or play with the bundled library."}
              </div>
            </div>
            <div className="name-fields">
              {Array.from({ length: game.playerCount }, (_, index) => (
                <div className="setup-field setup-player" key={index}>
                  <PlayerAvatar id={index} size={56} />
                  <div>
                    <label htmlFor={`playerName${index}`}>
                      Player {index + 1} name
                    </label>
                    <input
                      id={`playerName${index}`}
                      type="text"
                      maxLength={24}
                      placeholder={`Player ${index + 1}`}
                      value={game.draftNames[index] ?? ""}
                      onChange={(event) =>
                        game.setDraftName(index, event.target.value)
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="setup-actions">
              <button
                type="button"
                className="primary"
                onClick={() => void game.startGame()}
                disabled={game.loading}
              >
                {game.loading ? "Loading questions..." : "Let's play"}
              </button>
            </div>
          </section>
        ) : game.state.answerVisible && question ? (
          <section className="score-strip" aria-live="polite">
            <div className="qmeta">{question.category} · Answer</div>
            <div className="score-strip-answer">{question.answer}</div>
          </section>
        ) : game.state.questionVisible ? (
          <section className="question-panel" aria-live="polite">
            <div className="qmeta">
              {question
                ? `${question.difficulty} · ${question.category}`
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
            disabled={!!game.state.winner || game.setup}
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
        <div className="rules">
          Correct: +1. Wrong: −1. All 12 categories rotate in. No category twice
          in a row, and repeats from the same category stay at least 50 questions
          apart. The reader cannot score in rotation mode.
        </div>
      </div>
    </div>
  );
}
