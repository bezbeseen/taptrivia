"use client";

import { useSlapTrivia } from "@/hooks/use-slap-trivia";
import { PlayerAvatar } from "@/components/player-avatar";
import { levelLabel } from "@/lib/questions";
import { playUiTap } from "@/lib/sounds";
import "@/app/slap15.css";

export function Slap15App() {
  const game = useSlapTrivia();
  const result = game.roundResult;

  if (result) {
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

    return (
      <div className={`slap15 round-open ${tone}`}>
        <div
          className={`round-result ${tone}`}
          role="button"
          tabIndex={0}
          onClick={result.won ? game.resetGame : game.dismissRoundResult}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              if (result.won) game.resetGame();
              else game.dismissRoundResult();
            }
          }}
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
          <span className="round-continue">{result.continueLabel}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="slap15">
      <div className="wrap">
        <div className="top">
          <div>
            <h1>SLAP 15</h1>
            <div className="sub">{game.subtitle}</div>
          </div>
          <div className="top-actions">
            <div className="reader">
              {game.names.length ? `${game.readerName} is reading` : "Set up the game"}
            </div>
            <button
              type="button"
              className="rules-btn"
              onClick={() => game.setRulesOpen(!game.rulesOpen)}
            >
              {game.rulesOpen ? "Rules Open" : "Show Rules"}
            </button>
          </div>
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
              <li>First player to reach the winning net points wins.</li>
              <li>Questions continue forward even after Reset Game.</li>
            </ul>
            <button
              type="button"
              className="close-rules"
              onClick={() => game.setRulesOpen(false)}
            >
              Close Rules
            </button>
          </section>
        ) : null}

        {game.setup ? (
          <section className="question-panel">
            <div className="qmeta">Game Setup</div>
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
              <button type="button" onClick={game.startGame} disabled={game.loading}>
                {game.loading ? "Loading questions..." : "Start Game"}
              </button>
            </div>
            {game.loadError ? <div className="error">{game.loadError}</div> : null}
          </section>
        ) : (
          <section className="question-panel" aria-live="polite">
            <div className="qmeta">
              {game.activeLevel
                ? `${game.readerName} is reading • ${levelLabel(game.activeLevel)}`
                : "Ready"}
            </div>
            <div className="qtext">
              {!game.currentQuestion
                ? "Loading questions..."
                : game.state.questionVisible
                  ? game.currentQuestion.question
                  : "Press Show Question when the reader is ready."}
            </div>
            {game.state.answerVisible && game.currentQuestion ? (
              <div className="answer">{game.currentQuestion.answer}</div>
            ) : null}
            {game.state.questionVisible &&
            game.state.multipleChoice &&
            !game.state.answerVisible ? (
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
                onClick={game.showQuestion}
                disabled={!!game.state.winner || !game.currentQuestion}
              >
                Show Question
              </button>
              <button
                type="button"
                onClick={game.showAnswer}
                disabled={
                  !game.state.questionVisible ||
                  !!game.state.winner ||
                  !game.currentQuestion
                }
              >
                Show Answer
              </button>
              <button
                type="button"
                onClick={game.enableMultipleChoice}
                disabled={
                  !game.state.questionVisible ||
                  game.state.multipleChoice ||
                  game.state.answerVisible ||
                  !!game.state.winner ||
                  !game.currentQuestion
                }
              >
                Nobody knows
              </button>
            </div>
          </section>
        )}

        {game.confirmOpen ? (
          <div className="confirm">
            <div style={{ fontSize: 22, marginBottom: 12 }}>
              Answer already revealed
            </div>
            <div style={{ fontSize: 16, marginBottom: 14 }}>
              Are you sure you want to show the question again?
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={game.confirmShowQuestion}
                style={{ background: "#fff", color: "#b42318", minWidth: 120 }}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => {
                  playUiTap();
                  game.setConfirmOpen(false);
                }}
                style={{ background: "#2c2f33", color: "#fff", minWidth: 120 }}
              >
                No
              </button>
            </div>
          </div>
        ) : null}

        <div className="players">
          {game.names.map((name, index) => {
            const eligible = index !== game.state.reader && !game.state.winner;
            const nextPenalty = (game.state.misses[index] ?? 0) + 1;
            return (
              <section
                key={`${name}-${index}`}
                className={index === game.state.reader ? "card reading" : "card"}
              >
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
                  {game.state.misses[index] ?? 0} wrong • next miss -{nextPenalty}
                </div>
                <div className="buttons">
                  <button
                    type="button"
                    className={eligible ? "correct" : "correct disabled"}
                    disabled={!eligible}
                    onClick={() => game.markCorrect(index)}
                  >
                    +1 Correct
                  </button>
                  <button
                    type="button"
                    className={eligible ? "wrong" : "wrong disabled"}
                    disabled={!eligible}
                    onClick={() => game.markWrong(index)}
                  >
                    Wrong -{nextPenalty}
                  </button>
                </div>
              </section>
            );
          })}
        </div>

        {game.state.winner ? (
          <div className="winner">
            {game.names[game.state.winner.index]} wins with{" "}
            {game.state.scores[game.state.winner.index]} points!
          </div>
        ) : null}

        <div className="bottom">
          <button
            type="button"
            className="next"
            onClick={game.nextReader}
            disabled={!!game.state.winner || game.setup}
          >
            Next Reader
          </button>
          <button
            type="button"
            onClick={game.undo}
            disabled={game.historyLength === 0}
          >
            Undo Last
          </button>
          <button type="button" onClick={game.resetGame}>
            Reset Game
          </button>
        </div>

        <div className="status" aria-live="polite">
          {game.status}
        </div>
        <div className="rules">
          Correct answer: +1. Wrong answers escalate separately for each player:
          first miss -1, second miss -2, third miss -3, and so on. The reader
          cannot answer their own question. If nobody knows, it becomes multiple
          choice.
        </div>
      </div>
    </div>
  );
}
