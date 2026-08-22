"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { playCue, playFeint, playSlap, unlockAudio, vibrate } from "@/lib/audio";
import { FIGHTERS } from "@/lib/fighters";
import {
  GRADE_COPY,
  MAX_STRIKES,
  TOTAL_ROUNDS,
  getFighter,
  gradeReaction,
  isStrike,
  scoreRound,
  summarizeRun,
  type Grade,
  type Phase,
  type RoundResult,
  type RunSummary,
} from "@/lib/game";
import {
  getRecordsSnapshot,
  getServerRecordsSnapshot,
  saveRun,
  subscribeRecords,
} from "@/lib/storage";

type LastCall = {
  grade: Grade;
  reactionMs: number | null;
  points: number;
  combo: number;
};

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function useSlapGame() {
  const [phase, setPhase] = useState<Phase>("menu");
  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [lastCall, setLastCall] = useState<LastCall | null>(null);
  const [run, setRun] = useState<RunSummary | null>(null);
  const stored = useSyncExternalStore(
    subscribeRecords,
    getRecordsSnapshot,
    getServerRecordsSnapshot
  );
  const [writeError, setWriteError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const phaseRef = useRef<Phase>("menu");
  const comboRef = useRef(0);
  const scoreRef = useRef(0);
  const strikesRef = useRef(0);
  const maxComboRef = useRef(0);
  const resultsRef = useRef<RoundResult[]>([]);
  const roundRef = useRef(0);
  const cueAtRef = useRef(0);
  const timers = useRef<number[]>([]);
  const lockedRef = useRef(false);

  const setPhaseBoth = (next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  };

  const clearTimers = useCallback(() => {
    for (const id of timers.current) {
      window.clearTimeout(id);
    }
    timers.current = [];
  }, []);

  const later = useCallback((ms: number, fn: () => void) => {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
  }, []);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  const finishNight = useCallback(() => {
    clearTimers();
    const summary = summarizeRun({
      score: scoreRef.current,
      strikes: strikesRef.current,
      maxCombo: maxComboRef.current,
      results: resultsRef.current,
    });
    setRun(summary);
    const saved = saveRun(summary);
    setWriteError(saved.ok ? null : saved.error);
    setPhaseBoth("over");
  }, [clearTimers]);

  const resolve = useCallback(
    (grade: Grade, reactionMs: number | null) => {
      if (lockedRef.current) return;
      lockedRef.current = true;
      clearTimers();

      const fighter = getFighter(roundRef.current);
      const scored = scoreRound(grade, comboRef.current);
      const nextStrikes = strikesRef.current + (isStrike(grade) ? 1 : 0);
      const nextResult: RoundResult = {
        fighterId: fighter.id,
        grade,
        reactionMs,
        points: scored.points,
        combo: scored.comboAfter,
      };

      comboRef.current = scored.comboAfter;
      scoreRef.current += scored.points;
      strikesRef.current = nextStrikes;
      maxComboRef.current = Math.max(maxComboRef.current, scored.comboAfter);
      resultsRef.current = [...resultsRef.current, nextResult];

      setCombo(scored.comboAfter);
      setScore(scoreRef.current);
      setStrikes(nextStrikes);
      setMaxCombo(maxComboRef.current);
      setResults(resultsRef.current);
      setLastCall({
        grade,
        reactionMs,
        points: scored.points,
        combo: scored.comboAfter,
      });
      setShake(grade !== "late" && grade !== "early");
      later(280, () => setShake(false));

      if (grade === "perfect" || grade === "sharp" || grade === "clean") {
        playSlap("perfect");
        vibrate(grade === "perfect" ? 30 : 18);
      } else if (grade === "early") {
        playSlap("early");
        vibrate(40);
      } else {
        playSlap("hit");
        vibrate([20, 40, 40]);
      }

      setPhaseBoth("resolving");

      later(1350, () => {
        lockedRef.current = false;
        const cardDone = resultsRef.current.length >= TOTAL_ROUNDS;
        const outOfStrikes = strikesRef.current >= MAX_STRIKES;
        if (cardDone || outOfStrikes) {
          finishNight();
          return;
        }
        roundRef.current += 1;
        setRoundIndex(roundRef.current);
        setLastCall(null);
        setPhaseBoth("intro");
      });
    },
    [clearTimers, finishNight, later]
  );

  const armRound = useCallback(() => {
    const fighter = getFighter(roundRef.current);
    const wait = randomBetween(fighter.waitMin, fighter.waitMax);
    const useFeint = Math.random() < fighter.feintChance;
    setPhaseBoth("waiting");
    lockedRef.current = false;

    if (useFeint) {
      const feintAt = randomBetween(fighter.waitMin * 0.35, Math.max(wait - 420, 280));
      later(feintAt, () => {
        if (phaseRef.current !== "waiting") return;
        setPhaseBoth("feint");
        playFeint();
        later(160, () => {
          if (phaseRef.current !== "feint") return;
          setPhaseBoth("waiting");
        });
      });
    }

    later(wait, () => {
      if (phaseRef.current !== "waiting" && phaseRef.current !== "feint") return;
      cueAtRef.current = performance.now();
      setPhaseBoth("live");
      playCue();
      later(fighter.windowMs, () => {
        if (phaseRef.current === "live") {
          resolve("hit", null);
        }
      });
    });
  }, [later, resolve]);

  const beginIntro = useCallback(() => {
    clearTimers();
    setLastCall(null);
    setPhaseBoth("intro");
    later(1100, () => {
      if (phaseRef.current === "intro") armRound();
    });
  }, [armRound, clearTimers, later]);

  const startNight = useCallback(() => {
    void unlockAudio();
    clearTimers();
    lockedRef.current = false;
    roundRef.current = 0;
    comboRef.current = 0;
    scoreRef.current = 0;
    strikesRef.current = 0;
    maxComboRef.current = 0;
    resultsRef.current = [];
    setRoundIndex(0);
    setScore(0);
    setStrikes(0);
    setCombo(0);
    setMaxCombo(0);
    setResults([]);
    setLastCall(null);
    setRun(null);
    setShake(false);
    beginIntro();
  }, [beginIntro, clearTimers]);

  const slap = useCallback(() => {
    const current = phaseRef.current;
    if (current === "waiting" || current === "feint") {
      resolve("early", null);
      return;
    }
    if (current === "live") {
      const reaction = Math.max(0, performance.now() - cueAtRef.current);
      const fighter = getFighter(roundRef.current);
      resolve(gradeReaction(fighter, reaction), Math.round(reaction));
    }
  }, [resolve]);

  const showMenu = useCallback(() => {
    clearTimers();
    lockedRef.current = false;
    setPhaseBoth("menu");
  }, [clearTimers]);

  const showRecords = useCallback(() => {
    clearTimers();
    setPhaseBoth("records");
  }, [clearTimers]);

  return {
    phase,
    fighter: FIGHTERS[roundIndex]!,
    roundIndex,
    score,
    strikes,
    combo,
    maxCombo,
    results,
    lastCall,
    lastCopy: lastCall ? GRADE_COPY[lastCall.grade] : null,
    run,
    records: stored.data,
    recordsReady: isClient,
    storageError: writeError ?? (stored.ok ? null : stored.error),
    shake,
    startNight,
    slap,
    showMenu,
    showRecords,
    beginIntro,
  };
}
