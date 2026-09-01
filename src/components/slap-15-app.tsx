"use client";

import { useSlapTrivia } from "@/hooks/use-slap-trivia-integrated";
import { PlayerAvatar } from "@/components/player-avatar";
import { levelLabel } from "@/lib/questions";
import { playUiTap } from "@/lib/sounds";
import "@/app/slap15.css";

export function Slap15App() {
  const game = useSlapTrivia();
  const result = game.roundResult;

  const turnHint = game.state.winner
    ? `${game.names[game.state.winner.index]} just took the game.`
    : !game.state.questionVisible
      ? "Tap Show Question when you're ready."
      : game.state.multipleChoice && !game.state.answerVisible
        ? "Table's stumped. Pick a letter."
        : game.state.answerVisible
          ? "Mark who scored, then keep going."
          : "Everyone else slaps in after the question is read.";

  const turnKicker = game.state.winner ? "Winner" : "Now reading";

  if (result) {
    const pickingWinner = result.kind === "mc-correct";
    const tone =
      result.won
        ? "win"
        : result.kind === "correct" || result.kind === "mc-correct"
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
              <span className="logo-slap">SLAP</span>
              <span className="logo-15">15</span>
            </div>
            <div className="result-reader">
              {pickingWinner
                ? "Tap who scored"
                : result.won
                  ? "First to the winning score"
                  : result.kind === "correct" && game.nextReaderName
                    ? `${game.nextReaderName} reads next`
                    : game.readerName
                      ? `${game.readerName} is still reading`
                      : "Trivia showdown"}
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
            <PlayerAvatar id={result.avatar} size={120} title={result.name} />
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
                  if (index === game.state.reader) return null;
                  return (
                    <button
                      key={`${name}-${index}`}
                      type="button"
                      className="who-got-it-player"
                      onClick={() => game.markCorrect(index)}
                    >
                      <PlayerAvatar
                        id={game.avatars[index] ?? index}
                        size={48}
                        title={name}
                      />
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
              {result.kind === "correct" && !result.won && game.nextReaderName ? (
                <span className="btn-sub">{game.nextReaderName}&apos;s turn</span>
              ) : null}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="slap15">
      <div className="wrap">
        <div className="top">
          <div>
            <h1 className="logo">
              <span className="logo-slap">SLAP</span>
              <span className="logo-15">15</span>
            </h1>
            <div className="sub">{game.subtitle}</div>
          </div>
          <button
            type="button"
            className="rules-btn"
            onClick={() => game.setRulesOpen(!game.rulesOpen)}
          >
            {game.rulesOpen ? "Hide rules" : "Rules"}
          </button>
        </div>

        {game.rulesOpen ? (
          <section className="rules-panel">
            <h2>Game Rules</h2>
            <ul>
              <li>One player reads while the others compete.</li>
              <li>The full question must be read before anyone slaps.</li>
              <li>First slap gets the first answer.</li>
              <li>Correct answer: +1 point.</li>
              <li>
                Wrong answers escalate separately for each player: first miss -1,
                second miss -2, third miss -3, and so on.
              </li>
              <li>
                After a wrong first answer, another player gets one chance
                without slapping.
              </li>
              <li>
                If nobody knows, hit Nobody knows — or wait until every
                competitor misses — and the question becomes multiple choice.
              </li>
              <li>
                After a correct answer, the next player becomes the reader.
              </li>
              <li>Every third completed main-game question launches a mini game.</li>
              <li>First player to reach the winning net points wins.</li>
              <li>Questions continue forward even after Reset Game.</li>
            </ul>
            <button
              type="button"
              className="close-rules"
              onClick={() => game.setRulesOpen(false)}
            >
              Close rules
            </button>
          </section>
        ) : null}

        {!game.setup ? (
          <section className="turn-banner" key={game.state.reader}>
            <PlayerAvatar
              id={game.readerAvatar}
              size={88}
              title={game.readerName}
            />
            <div className="turn-copy">
              <div className="turn-kicker">{turnKicker}</div>
              <div className="turn-name">{game.readerName}</div>
              <div className="turn-hint">{turnHint}</div>
            </div>
          </section>
        ) : null}

        {game.setup ? (
          <section className="question-panel">
            <div className="qmeta">Game setup</div>
            <div className="qtext" style={{ minHeight: 0 }}>
              Set the level, players, and winning score.
            </div>
            <div className="setup-grid">
              <div className="setup-field">
                <label htmlFor="levelSelect">Question level</label>
                <select
                  id="levelSelect"
                  value={game.level}
                  onChange={(event) =>
                    game.setLevel(event.target.value as typeof game.level)
                  }
                >
                  <option value="">Choose level</option>
                  {game.levels.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                      {game.questionCounts[item.value]
                        ? ` · ${game.questionCounts[item.value].toLocaleString()} questions`
                        : ""}
                    </option>
                  ))}
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
                  {[3, 4, 5, 6, 7, 8].map((count) => (
                    <option key={count} value={count}>
                      {count}
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
            <div className="name-fields">
              {Array.from({ length: game.playerCount }, (_, index) => (
                <div className="setup-field setup-player" key={index}>
                  <button
                    type="button"
                    className="avatar-pick"
                    onClick={() => game.cycleDraftAvatar(index)}
                    title="Tap to change avatar"
                  >
                    <PlayerAvatar id={game.draftAvatars[index] ?? index} size={56} />
                    <span>Tap to change</span>
                  </button>
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
              <button type="button" className="primary" onClick={game.startGame} disabled={game.loading}>
                {game.loading ? "Loading questions..." : "Let's play"}
              </button>
            </div>
            {game.loadError ? <div className="error">{game.loadError}</div> : null}
          </section>
        ) : game.state.answerVisible && game.currentQuestion ? (
          <section className="score-strip" aria-live="polite">
            <div className="qmeta">
              {game.activeLevel
                ? `${levelLabel(game.activeLevel)} · Answer`
                : "Answer"}
            </div>
            <div className="score-strip-answer">{game.currentQuestion.answer}</div>
          </section>
        ) : game.state.questionVisible ? (
          <section className="question-panel" aria-live="polite">
            <div className="qmeta">
              {game.activeLevel
                ? game.currentQuestion?.category
                  ? `${levelLabel(game.activeLevel)} · ${game.currentQuestion.category}`
                  : levelLabel(game.activeLevel)
                : "Ready"}
            </div>
            <div className="qtext">
              {!game.currentQuestion
                ? "Loading questions..."
                : game.currentQuestion.question}
            </div>
            {game.state.multipleChoice ? (
              <div className="choices">
                {game.choices.map((choice, index) => {
                  const out = game.state.eliminatedChoices.includes(index);
                  return (
                    <button
                      key={`${choice.text}-${index}`}
                      type="button"
                      className={out ? "choice out" : "choice"}
                      disabled={out || !!game.state.winner}
                      onClick={() => game.pickChoice(index)}
                    >
                      <span className="choice-letter">
                        {String.fromCharCode(65 + index)}
                      </span>
                      {choice.text}
                    </button>
                  );
                })}
              </div>
            ) : null}
            <div className="qbuttons">
              <button
                type="button"
                className="primary"
                onClick={game.showAnswer}
                disabled={!!game.state.winner || !game.currentQuestion}
              >
                Reveal answer
              </button>
              <button
                type="button"
                className="nobody"
                onClick={game.enableMultipleChoice}
                disabled={
                  game.state.multipleChoice ||
                  !!game.state.winner ||
                  !game.currentQuestion
                }
              >
                Nobody knows
              </button>
            </div>
          </section>
        ) : (
          <div className="next-card">
            <button
              type="button"
              className="primary"
              onClick={game.showQuestion}
              disabled={!!game.state.winner || !game.currentQuestion}
            >
              Show question
            </button>
          </div>
        )}

        {game.confirmOpen ? (
          <div className="confirm">
            <div className="confirm-title">Answer already revealed</div>
            <div className="confirm-copy">
              Show the question again anyway?
            </div>
            <div className="confirm-actions">
              <button
                type="button"
                className="primary"
                onClick={game.confirmShowQuestion}
              >
                Yes, show it
              </button>
              <button
                type="button"
                onClick={() => {
                  playUiTap();
                  game.setConfirmOpen(false);
                }}
              >
                No, keep going
              </button>
            </div>
          </div>
        ) : null}

        <div className="players">
          {game.names.map((name, index) => {
            const isReader = index === game.state.reader;
            const eligible = !isReader && !game.state.winner;
            const nextPenalty = (game.state.misses[index] ?? 0) + 1;
            return (
              <section
                key={`${name}-${index}`}
                className={isReader ? "card reading" : "card"}
              >
                {isReader ? <div className="reading-pill">Reading</div> : null}
                <button
                  type="button"
                  className="avatar-btn"
                  onClick={() => game.cycleAvatar(index)}
                  title="Tap to change avatar"
                >
                  <PlayerAvatar
                    id={game.avatars[index] ?? index}
                    size={72}
                    title={name}
                  />
                </button>
                <div className="name">{name}</div>
                <div className="score">{game.state.scores[index] ?? 0}</div>
                <div className="miss">
                  {game.state.misses[index] ?? 0} wrong
                  {isReader ? "" : ` · next miss −${nextPenalty}`}
                </div>
                {isReader ? (
                  <div className="seat-note">Sit this one out. You&apos;re reading.</div>
                ) : (
                  <div className="buttons">
                    <button
                      type="button"
                      className={eligible ? "correct" : "correct disabled"}
                      disabled={!eligible}
                      onClick={() => game.markCorrect(index)}
                    >
                      Correct
                      <span className="btn-sub">+1 point</span>
                    </button>
                    <button
                      type="button"
                      className={eligible ? "wrong" : "wrong disabled"}
                      disabled={!eligible}
                      onClick={() => game.markWrong(index)}
                    >
                      Wrong
                      <span className="btn-sub">−{nextPenalty}</span>
                    </button>
                  </div>
                )}
              </section>
            );
          })}
        </div>

        {!game.setup ? (
          <div className="footer-actions">
            <button
              type="button"
              onClick={game.undo}
              disabled={!game.historyLength}
            >
              Undo
            </button>
            <button type="button" onClick={game.nextReader}>
              Next reader
            </button>
            <button type="button" onClick={game.resetGame}>
              Reset game
            </button>
          </div>
        ) : null}

        <div className="status">{game.status}</div>
      </div>
      <script src="/mini-game-loader.js" async />
    </div>
  );
}
