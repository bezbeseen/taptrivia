"use client";

import { useTapTrivia } from "@/hooks/use-tap-trivia";
import { SetupScreen } from "@/tap-trivia/ui/setup-screen";
import { TableScreen } from "@/tap-trivia/ui/table-screen";
import "@/app/slap15.css";

export function TapTriviaApp() {
  const game = useTapTrivia();

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
        {game.setup ? <SetupScreen game={game} /> : <TableScreen game={game} />}
      </div>
    </div>
  );
}
