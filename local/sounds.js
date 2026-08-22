"use strict";
var Slap15Sounds = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/lib/sounds.ts
  var sounds_exports = {};
  __export(sounds_exports, {
    playAvatarSound: () => playAvatarSound,
    playConfirmSound: () => playConfirmSound,
    playContinueSound: () => playContinueSound,
    playCorrectSound: () => playCorrectSound,
    playErrorSound: () => playErrorSound,
    playMultipleChoiceSound: () => playMultipleChoiceSound,
    playNextReaderSound: () => playNextReaderSound,
    playNopeSound: () => playNopeSound,
    playResetSound: () => playResetSound,
    playRulesSound: () => playRulesSound,
    playShowAnswerSound: () => playShowAnswerSound,
    playShowQuestionSound: () => playShowQuestionSound,
    playStartSound: () => playStartSound,
    playUiTap: () => playUiTap,
    playUndoSound: () => playUndoSound,
    playWinSound: () => playWinSound,
    playWrongSound: () => playWrongSound,
    ringAlarm: () => ringAlarm
  });
  var ctx = null;
  var n = {
    correct: 0,
    wrong: 0,
    nope: 0,
    tap: 0,
    avatar: 0,
    question: 0,
    answer: 0,
    continue: 0,
    mc: 0,
    fart: 0
  };
  function audio() {
    if (typeof window === "undefined") return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!ctx) ctx = new AudioCtx();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  }
  function play(fn) {
    try {
      const ac = audio();
      if (!ac) return;
      fn(ac);
    } catch {
    }
  }
  function cycle(list, slot) {
    const fn = list[n[slot] % list.length];
    n[slot] += 1;
    if (fn) play(fn);
  }
  function envGain(ac, start, peak, dur) {
    const gain = ac.createGain();
    gain.gain.setValueAtTime(1e-4, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(1e-4, start + dur);
    return gain;
  }
  function tone(ac, {
    type = "square",
    freq,
    endFreq,
    at = 0,
    dur = 0.18,
    gain = 0.12
  }) {
    const now = ac.currentTime + at;
    const osc = ac.createOscillator();
    const amp = envGain(ac, now, gain, dur);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 20), now + dur);
    osc.connect(amp);
    amp.connect(ac.destination);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }
  function brownNoise(ac, dur) {
    const frames = Math.max(1, Math.floor(ac.sampleRate * dur));
    const buffer = ac.createBuffer(1, frames, ac.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < frames; i++) {
      last = last * 0.93 + (Math.random() * 2 - 1) * 0.07;
      data[i] = last * 3.2;
    }
    return buffer;
  }
  function noiseBurst(ac, at, dur, gain, freq = 1200, type = "lowpass") {
    const src = ac.createBufferSource();
    src.buffer = brownNoise(ac, dur);
    const filter = ac.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    filter.Q.value = type === "bandpass" ? 6 : 0.7;
    const amp = envGain(ac, ac.currentTime + at, gain, dur);
    src.connect(filter);
    filter.connect(amp);
    amp.connect(ac.destination);
    src.start(ac.currentTime + at);
  }
  function noiseSweep(ac, {
    at = 0,
    dur,
    gain,
    startFreq,
    endFreq,
    q = 5
  }) {
    const now = ac.currentTime + at;
    const src = ac.createBufferSource();
    src.buffer = brownNoise(ac, dur);
    const filter = ac.createBiquadFilter();
    filter.type = "lowpass";
    filter.Q.value = q;
    filter.frequency.setValueAtTime(startFreq, now);
    filter.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 28), now + dur);
    const amp = envGain(ac, now, gain, dur);
    src.connect(filter);
    filter.connect(amp);
    amp.connect(ac.destination);
    src.start(now);
  }
  function chord(ac, freqs, at, dur, gain, type = "square") {
    freqs.forEach((freq) => tone(ac, { type, freq, at, dur, gain: gain / freqs.length }));
  }
  function honk(ac) {
    tone(ac, { type: "sawtooth", freq: 180, endFreq: 140, dur: 0.22, gain: 0.16 });
    tone(ac, { type: "square", freq: 360, endFreq: 280, dur: 0.22, gain: 0.08 });
    noiseBurst(ac, 0, 0.12, 0.08, 700);
  }
  function duck(ac) {
    tone(ac, { type: "square", freq: 420, endFreq: 180, dur: 0.14, gain: 0.14 });
    tone(ac, { type: "square", freq: 380, endFreq: 140, at: 0.12, dur: 0.16, gain: 0.12 });
  }
  function kazooFanfare(ac) {
    [523, 659, 784, 1046].forEach((freq, i) => {
      tone(ac, { type: "square", freq, at: i * 0.09, dur: 0.16, gain: 0.11 });
      tone(ac, { type: "sawtooth", freq: freq * 1.01, at: i * 0.09, dur: 0.16, gain: 0.04 });
    });
    tone(ac, { type: "triangle", freq: 1318, at: 0.38, dur: 0.28, gain: 0.1 });
  }
  function springBoing(ac) {
    tone(ac, { type: "sine", freq: 140, endFreq: 720, dur: 0.22, gain: 0.16 });
    tone(ac, { type: "triangle", freq: 720, endFreq: 420, at: 0.18, dur: 0.22, gain: 0.1 });
    tone(ac, { type: "square", freq: 880, at: 0.32, dur: 0.12, gain: 0.07 });
  }
  function coinChoir(ac) {
    [0, 0.08, 0.16, 0.28].forEach((at, i) => {
      tone(ac, { type: "square", freq: 880 + i * 120, at, dur: 0.12, gain: 0.09 });
    });
    tone(ac, { type: "triangle", freq: 1320, at: 0.22, dur: 0.35, gain: 0.08 });
  }
  function slideWhistleUp(ac) {
    tone(ac, { type: "sine", freq: 220, endFreq: 980, dur: 0.35, gain: 0.14 });
    tone(ac, { type: "triangle", freq: 330, endFreq: 1200, dur: 0.35, gain: 0.05 });
  }
  function slideWhistleDown(ac) {
    tone(ac, { type: "sine", freq: 980, endFreq: 180, dur: 0.38, gain: 0.14 });
    tone(ac, { type: "triangle", freq: 720, endFreq: 140, dur: 0.38, gain: 0.05 });
  }
  function clownHorn(ac) {
    honk(ac);
    tone(ac, { type: "square", freq: 240, at: 0.12, dur: 0.18, gain: 0.12 });
    tone(ac, { type: "square", freq: 190, at: 0.22, dur: 0.22, gain: 0.12 });
  }
  function wahWah(ac) {
    tone(ac, { type: "sawtooth", freq: 400, endFreq: 180, dur: 0.35, gain: 0.13 });
    tone(ac, { type: "sawtooth", freq: 300, endFreq: 140, at: 0.28, dur: 0.4, gain: 0.11 });
  }
  function raspberry(ac) {
    noiseSweep(ac, { dur: 0.34, gain: 0.2, startFreq: 260, endFreq: 70, q: 3 });
    tone(ac, { type: "sawtooth", freq: 70, endFreq: 48, dur: 0.32, gain: 0.14 });
    tone(ac, { type: "square", freq: 90, endFreq: 55, dur: 0.28, gain: 0.08 });
  }
  function wetFart(ac) {
    noiseSweep(ac, { dur: 0.5, gain: 0.24, startFreq: 190, endFreq: 48 });
    noiseSweep(ac, { at: 0.1, dur: 0.28, gain: 0.14, startFreq: 140, endFreq: 60, q: 8 });
    tone(ac, { type: "sine", freq: 58, endFreq: 36, dur: 0.48, gain: 0.2 });
    tone(ac, { type: "sawtooth", freq: 82, endFreq: 44, dur: 0.4, gain: 0.07 });
  }
  function tootFart(ac) {
    tone(ac, { type: "square", freq: 98, endFreq: 68, dur: 0.13, gain: 0.17 });
    noiseSweep(ac, { dur: 0.16, gain: 0.18, startFreq: 240, endFreq: 70 });
    tone(ac, { type: "sine", freq: 72, endFreq: 46, at: 0.1, dur: 0.18, gain: 0.16 });
  }
  function longFart(ac) {
    noiseSweep(ac, { dur: 0.78, gain: 0.22, startFreq: 170, endFreq: 34, q: 4 });
    tone(ac, { type: "sine", freq: 52, endFreq: 28, dur: 0.78, gain: 0.18 });
    tone(ac, { type: "sawtooth", freq: 88, endFreq: 38, dur: 0.6, gain: 0.07 });
  }
  function squeakyFart(ac) {
    tone(ac, { type: "square", freq: 260, endFreq: 70, dur: 0.3, gain: 0.12 });
    noiseSweep(ac, { at: 0.04, dur: 0.34, gain: 0.2, startFreq: 420, endFreq: 55, q: 6 });
    tone(ac, { type: "sine", freq: 96, endFreq: 40, at: 0.12, dur: 0.3, gain: 0.15 });
  }
  function doubleToot(ac) {
    tootFart(ac);
    tone(ac, { type: "square", freq: 84, endFreq: 52, at: 0.24, dur: 0.18, gain: 0.17 });
    noiseSweep(ac, { at: 0.24, dur: 0.2, gain: 0.16, startFreq: 200, endFreq: 48 });
    tone(ac, { type: "sine", freq: 64, endFreq: 38, at: 0.28, dur: 0.18, gain: 0.14 });
  }
  function rippleFart(ac) {
    [0, 0.1, 0.2, 0.34].forEach((at, i) => {
      noiseSweep(ac, {
        at,
        dur: 0.13,
        gain: 0.16 - i * 0.02,
        startFreq: 210 - i * 28,
        endFreq: 58
      });
      tone(ac, {
        type: "sine",
        freq: 86 - i * 8,
        endFreq: 42,
        at,
        dur: 0.13,
        gain: 0.11
      });
    });
  }
  function goat(ac) {
    tone(ac, { type: "sawtooth", freq: 320, endFreq: 420, dur: 0.12, gain: 0.12 });
    tone(ac, { type: "sawtooth", freq: 400, endFreq: 260, at: 0.1, dur: 0.16, gain: 0.12 });
    tone(ac, { type: "square", freq: 280, endFreq: 180, at: 0.22, dur: 0.18, gain: 0.1 });
  }
  function partyHorn(ac) {
    tone(ac, { type: "sawtooth", freq: 400, endFreq: 880, dur: 0.45, gain: 0.1 });
    noiseBurst(ac, 0, 0.45, 0.1, 1800, "bandpass");
    [0.08, 0.18, 0.28, 0.38].forEach((at) => {
      tone(ac, { type: "square", freq: 700 + at * 400, at, dur: 0.08, gain: 0.06 });
    });
  }
  function baDumTss(ac) {
    tone(ac, { type: "sine", freq: 160, endFreq: 70, dur: 0.16, gain: 0.2 });
    tone(ac, { type: "sine", freq: 220, endFreq: 90, at: 0.16, dur: 0.16, gain: 0.18 });
    noiseBurst(ac, 0.34, 0.28, 0.16, 5e3, "highpass");
  }
  function airhorn(ac) {
    chord(ac, [174, 220, 261], 0, 0.22, 0.22, "sawtooth");
    chord(ac, [174, 220, 261], 0.18, 0.38, 0.2, "sawtooth");
  }
  function yodel(ac) {
    [523, 784, 523, 880, 659].forEach((freq, i) => {
      tone(ac, { type: "triangle", freq, at: i * 0.09, dur: 0.12, gain: 0.12 });
    });
  }
  function cartoonZip(ac) {
    tone(ac, { type: "square", freq: 120, endFreq: 1400, dur: 0.22, gain: 0.1 });
    tone(ac, { type: "triangle", freq: 1400, endFreq: 400, at: 0.2, dur: 0.16, gain: 0.08 });
  }
  function circusSting(ac) {
    chord(ac, [392, 494, 587], 0, 0.16, 0.16);
    chord(ac, [349, 440, 523], 0.14, 0.16, 0.16);
    chord(ac, [523, 659, 784], 0.3, 0.32, 0.18);
  }
  function cashRegister(ac) {
    noiseBurst(ac, 0, 0.06, 0.1, 3e3);
    tone(ac, { type: "square", freq: 1200, at: 0.05, dur: 0.08, gain: 0.08 });
    tone(ac, { type: "square", freq: 1600, at: 0.12, dur: 0.1, gain: 0.08 });
    tone(ac, { type: "triangle", freq: 2e3, at: 0.2, dur: 0.22, gain: 0.07 });
  }
  function bubblePop(ac) {
    [0, 0.07, 0.14, 0.24].forEach((at, i) => {
      tone(ac, { type: "sine", freq: 420 + i * 90, endFreq: 90, at, dur: 0.12, gain: 0.1 });
    });
  }
  function powerUp(ac) {
    [262, 330, 392, 523, 659, 784].forEach((freq, i) => {
      tone(ac, { type: "square", freq, at: i * 0.05, dur: 0.1, gain: 0.08 });
    });
  }
  function buzzer(ac) {
    tone(ac, { type: "square", freq: 110, dur: 0.28, gain: 0.14 });
    tone(ac, { type: "square", freq: 146, dur: 0.28, gain: 0.1 });
    noiseBurst(ac, 0, 0.28, 0.06, 800);
  }
  function cuckoo(ac) {
    tone(ac, { type: "triangle", freq: 659, dur: 0.14, gain: 0.12 });
    tone(ac, { type: "triangle", freq: 523, at: 0.16, dur: 0.18, gain: 0.12 });
  }
  function hiccup(ac) {
    tone(ac, { type: "sine", freq: 240, endFreq: 420, dur: 0.08, gain: 0.14 });
    tone(ac, { type: "sine", freq: 200, endFreq: 360, at: 0.16, dur: 0.09, gain: 0.12 });
  }
  function whipCrack(ac) {
    tone(ac, { type: "sawtooth", freq: 1400, endFreq: 180, dur: 0.08, gain: 0.1 });
    noiseBurst(ac, 0.05, 0.1, 0.18, 5e3, "highpass");
  }
  function cowbell(ac) {
    tone(ac, { type: "square", freq: 587, dur: 0.12, gain: 0.08 });
    tone(ac, { type: "square", freq: 845, dur: 0.1, gain: 0.06 });
    noiseBurst(ac, 0, 0.08, 0.08, 2500);
  }
  function xylophone(ac) {
    [523, 659, 784, 1046].forEach((freq, i) => {
      tone(ac, { type: "triangle", freq, at: i * 0.07, dur: 0.18, gain: 0.11 });
    });
  }
  function laserPew(ac) {
    tone(ac, { type: "sawtooth", freq: 980, endFreq: 120, dur: 0.18, gain: 0.1 });
    tone(ac, { type: "square", freq: 720, endFreq: 90, dur: 0.16, gain: 0.05 });
  }
  function whoosh(ac) {
    noiseBurst(ac, 0, 0.28, 0.14, 800, "bandpass");
    tone(ac, { type: "sine", freq: 200, endFreq: 640, dur: 0.28, gain: 0.06 });
  }
  function rewind(ac) {
    [880, 740, 620, 520, 430, 360, 280].forEach((freq, i) => {
      tone(ac, { type: "square", freq, at: i * 0.04, dur: 0.06, gain: 0.07 });
    });
  }
  function pageFlip(ac) {
    noiseBurst(ac, 0, 0.08, 0.1, 1800, "highpass");
    noiseBurst(ac, 0.06, 0.1, 0.08, 900);
  }
  function drumroll(ac) {
    for (let i = 0; i < 10; i++) {
      noiseBurst(ac, i * 0.045, 0.04, 0.08 + i * 6e-3, 1800);
    }
    chord(ac, [392, 494, 587], 0.48, 0.35, 0.18);
  }
  function taDa(ac) {
    chord(ac, [392, 494, 587], 0, 0.18, 0.16);
    chord(ac, [523, 659, 784, 1046], 0.2, 0.45, 0.18);
  }
  function gameOver(ac) {
    chord(ac, [196, 247, 294], 0, 0.22, 0.14, "sawtooth");
    chord(ac, [175, 220, 262], 0.2, 0.22, 0.14, "sawtooth");
    chord(ac, [147, 185, 220], 0.42, 0.5, 0.16, "sawtooth");
  }
  function pop(ac) {
    tone(ac, { type: "sine", freq: 420, endFreq: 140, dur: 0.09, gain: 0.12 });
    noiseBurst(ac, 0, 0.05, 0.06, 1800);
  }
  function blip(ac) {
    tone(ac, { type: "square", freq: 660, dur: 0.06, gain: 0.07 });
    tone(ac, { type: "square", freq: 880, at: 0.05, dur: 0.06, gain: 0.05 });
  }
  function boing(ac) {
    tone(ac, { type: "sine", freq: 180, endFreq: 520, dur: 0.14, gain: 0.12 });
    tone(ac, { type: "triangle", freq: 520, endFreq: 260, at: 0.12, dur: 0.14, gain: 0.08 });
  }
  function sparkle(ac) {
    [1200, 1500, 1800, 2100].forEach((freq, i) => {
      tone(ac, { type: "sine", freq, at: i * 0.05, dur: 0.12, gain: 0.06 });
    });
  }
  function klaxon(ac) {
    tone(ac, { type: "sawtooth", freq: 440, endFreq: 330, dur: 0.16, gain: 0.12 });
    tone(ac, { type: "sawtooth", freq: 330, endFreq: 440, at: 0.16, dur: 0.16, gain: 0.12 });
    tone(ac, { type: "sawtooth", freq: 440, endFreq: 330, at: 0.32, dur: 0.18, gain: 0.12 });
  }
  function ukulele(ac) {
    [392, 494, 587, 740].forEach((freq, i) => {
      tone(ac, { type: "triangle", freq, at: i * 0.03, dur: 0.28, gain: 0.07 });
    });
  }
  function thereminWoo(ac) {
    tone(ac, { type: "sine", freq: 300, endFreq: 720, dur: 0.28, gain: 0.1 });
    tone(ac, { type: "sine", freq: 720, endFreq: 240, at: 0.26, dur: 0.32, gain: 0.1 });
  }
  function rimshot(ac) {
    noiseBurst(ac, 0, 0.05, 0.16, 4e3, "highpass");
    tone(ac, { type: "sine", freq: 180, endFreq: 80, dur: 0.12, gain: 0.16 });
  }
  var CORRECT = [
    kazooFanfare,
    springBoing,
    coinChoir,
    slideWhistleUp,
    partyHorn,
    baDumTss,
    yodel,
    cartoonZip,
    circusSting,
    cashRegister,
    bubblePop,
    powerUp,
    airhorn,
    xylophone,
    ukulele,
    sparkle,
    taDa
  ];
  var FARTS = [
    wetFart,
    tootFart,
    longFart,
    squeakyFart,
    doubleToot,
    rippleFart,
    raspberry
  ];
  var TAPS = [pop, blip, cowbell, boing, laserPew];
  var AVATARS = [boing, duck, hiccup, sparkle, goat, bubblePop, cartoonZip];
  var QUESTIONS = [whoosh, whipCrack, cartoonZip, drumroll, rimshot];
  var ANSWERS = [cuckoo, sparkle, xylophone, cashRegister, ukulele];
  var CONTINUES = [pop, blip, whoosh, boing, powerUp];
  var MCS = [wahWah, thereminWoo, klaxon, partyHorn, slideWhistleDown];
  function ringAlarm() {
    play(clownHorn);
  }
  function playCorrectSound() {
    cycle(CORRECT, "correct");
  }
  function playWrongSound() {
    cycle(FARTS, "fart");
  }
  function playNopeSound() {
    cycle(FARTS, "fart");
  }
  function playMultipleChoiceSound() {
    cycle(MCS, "mc");
  }
  function playUiTap() {
    cycle(TAPS, "tap");
  }
  function playAvatarSound() {
    cycle(AVATARS, "avatar");
  }
  function playShowQuestionSound() {
    cycle(QUESTIONS, "question");
  }
  function playShowAnswerSound() {
    cycle(ANSWERS, "answer");
  }
  function playContinueSound() {
    cycle(CONTINUES, "continue");
  }
  function playStartSound() {
    play(drumroll);
  }
  function playWinSound() {
    play(taDa);
    play((ac) => {
      partyHorn(ac);
      coinChoir(ac);
    });
  }
  function playUndoSound() {
    play(rewind);
  }
  function playNextReaderSound() {
    play(whoosh);
    play(ukulele);
  }
  function playResetSound() {
    play(gameOver);
  }
  function playRulesSound() {
    play(pageFlip);
  }
  function playErrorSound() {
    play(buzzer);
  }
  function playConfirmSound() {
    play(whipCrack);
  }
  return __toCommonJS(sounds_exports);
})();
