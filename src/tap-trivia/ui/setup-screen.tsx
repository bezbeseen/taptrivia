"use client";

import { PlayerAvatar } from "@/components/player-avatar";
import type { TapTriviaGame } from "@/hooks/use-tap-trivia";
import { QUESTION_TYPES } from "@/tap-trivia/database";
import { RULE_COPY, defaultWinScore } from "@/tap-trivia/rules";
import type { TapDifficulty, TapMode } from "@/tap-trivia/types";

export function SetupScreen({ game }: { game: TapTriviaGame }) {
  return (
    <section className="question-panel">
      <div className="qmeta">Game setup</div>
      <div className="qtext" style={{ minHeight: 0 }}>
        Four pieces, kept apart: gameplay, rules, the question database, and this screen.
      </div>

      <div className="layer">
        <div className="layer-kicker">Gameplay</div>
        <div className="layer-title">How the table runs</div>
        <div className="layer-note">
          Who reads, how many seats, and how hard the questions are. Scoring math lives in Rules.
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
              {Array.from(
                { length: game.maxPlayers - game.minPlayers + 1 },
                (_, i) => game.minPlayers + i
              ).map((count) => (
                <option key={count} value={count}>
                  {count} · first to {defaultWinScore(count)}
                </option>
              ))}
            </select>
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
      </div>

      <div className="layer">
        <div className="layer-kicker">Rules</div>
        <div className="layer-title">Scoring and win</div>
        <div className="layer-note">{RULE_COPY}</div>
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

      <div className="layer">
        <div className="layer-kicker">Database</div>
        <div className="layer-title">Question bank</div>
        <div className="setup-field">
          <label htmlFor="databaseFile">CSV file</label>
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
              ? `${game.dbCount.toLocaleString()} questions from the ${game.dbSource}.`
              : "Upload Tap_Trivia_Question_Database.csv, or play with the bundled library."}
          </div>
          {game.dbSource !== "bundled library" ? (
            <button
              type="button"
              className="ghost-link"
              disabled={game.importing}
              onClick={() => void game.useBundledLibrary()}
            >
              Switch back to bundled library
            </button>
          ) : null}
        </div>

        <div className="layer-sub">Question type</div>
        <div className="type-toggles">
          {QUESTION_TYPES.map((item) => {
            const on = game.types[item.id];
            const count = game.typeCounts[item.id];
            return (
              <button
                key={item.id}
                type="button"
                className={on ? "type-toggle on" : "type-toggle"}
                aria-pressed={on}
                onClick={() => game.toggleType(item.id)}
              >
                <span className="type-check" aria-hidden>
                  {on ? "✓" : ""}
                </span>
                <span>
                  <span className="type-label">{item.label}</span>
                  <span className="type-hint">
                    {item.hint}
                    {count ? ` ${count.toLocaleString()} in this bank.` : ""}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="layer-sub">Multiple choice</div>
        <div className="layer-note" style={{ marginBottom: 0 }}>
          Multiple-choice cards shuffle four options and show them as A–D. True / False
          always shows True and False. Open answers stay spoken — no choices on the card.
        </div>
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
  );
}
