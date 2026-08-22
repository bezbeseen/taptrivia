let ctx: AudioContext | null = null;
const n = {
  correct: 0,
  wrong: 0,
  nope: 0,
  tap: 0,
  avatar: 0,
  question: 0,
  answer: 0,
  continue: 0,
  mc: 0,
  fart: 0,
};

type Fx = (ac: AudioContext) => void;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!ctx) ctx = new AudioCtx();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function play(fn: Fx) {
  try {
    const ac = audio();
    if (!ac) return;
    fn(ac);
  } catch {
    /* Sounds are optional. */
  }
}

function cycle(list: Fx[], slot: keyof typeof n) {
  const fn = list[n[slot] % list.length];
  n[slot] += 1;
  if (fn) play(fn);
}

function envGain(ac: AudioContext, start: number, peak: number, dur: number) {
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  return gain;
}

function tone(
  ac: AudioContext,
  {
    type = "square",
    freq,
    endFreq,
    at = 0,
    dur = 0.18,
    gain = 0.12,
  }: {
    type?: OscillatorType;
    freq: number;
    endFreq?: number;
    at?: number;
    dur?: number;
    gain?: number;
  }
) {
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

function brownNoise(ac: AudioContext, dur: number) {
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

function noiseBurst(
  ac: AudioContext,
  at: number,
  dur: number,
  gain: number,
  freq = 1200,
  type: BiquadFilterType = "lowpass"
) {
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

function noiseSweep(
  ac: AudioContext,
  {
    at = 0,
    dur,
    gain,
    startFreq,
    endFreq,
    q = 5,
  }: {
    at?: number;
    dur: number;
    gain: number;
    startFreq: number;
    endFreq: number;
    q?: number;
  }
) {
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

function chord(ac: AudioContext, freqs: number[], at: number, dur: number, gain: number, type: OscillatorType = "square") {
  freqs.forEach((freq) => tone(ac, { type, freq, at, dur, gain: gain / freqs.length }));
}

function honk(ac: AudioContext) {
  tone(ac, { type: "sawtooth", freq: 180, endFreq: 140, dur: 0.22, gain: 0.16 });
  tone(ac, { type: "square", freq: 360, endFreq: 280, dur: 0.22, gain: 0.08 });
  noiseBurst(ac, 0, 0.12, 0.08, 700);
}

function duck(ac: AudioContext) {
  tone(ac, { type: "square", freq: 420, endFreq: 180, dur: 0.14, gain: 0.14 });
  tone(ac, { type: "square", freq: 380, endFreq: 140, at: 0.12, dur: 0.16, gain: 0.12 });
}

function sadTrombone(ac: AudioContext) {
  [349, 330, 294, 220].forEach((freq, i) => {
    tone(ac, { type: "sawtooth", freq, endFreq: freq - 30, at: i * 0.22, dur: 0.28, gain: 0.12 });
  });
}

function recordScratch(ac: AudioContext) {
  noiseBurst(ac, 0, 0.18, 0.18, 2400);
  tone(ac, { type: "sawtooth", freq: 900, endFreq: 90, dur: 0.22, gain: 0.1 });
}

function splat(ac: AudioContext) {
  noiseBurst(ac, 0, 0.2, 0.2, 500);
  tone(ac, { type: "triangle", freq: 90, endFreq: 40, dur: 0.28, gain: 0.18 });
}

function kazooFanfare(ac: AudioContext) {
  [523, 659, 784, 1046].forEach((freq, i) => {
    tone(ac, { type: "square", freq, at: i * 0.09, dur: 0.16, gain: 0.11 });
    tone(ac, { type: "sawtooth", freq: freq * 1.01, at: i * 0.09, dur: 0.16, gain: 0.04 });
  });
  tone(ac, { type: "triangle", freq: 1318, at: 0.38, dur: 0.28, gain: 0.1 });
}

function springBoing(ac: AudioContext) {
  tone(ac, { type: "sine", freq: 140, endFreq: 720, dur: 0.22, gain: 0.16 });
  tone(ac, { type: "triangle", freq: 720, endFreq: 420, at: 0.18, dur: 0.22, gain: 0.1 });
  tone(ac, { type: "square", freq: 880, at: 0.32, dur: 0.12, gain: 0.07 });
}

function coinChoir(ac: AudioContext) {
  [0, 0.08, 0.16, 0.28].forEach((at, i) => {
    tone(ac, { type: "square", freq: 880 + i * 120, at, dur: 0.12, gain: 0.09 });
  });
  tone(ac, { type: "triangle", freq: 1320, at: 0.22, dur: 0.35, gain: 0.08 });
}

function slideWhistleUp(ac: AudioContext) {
  tone(ac, { type: "sine", freq: 220, endFreq: 980, dur: 0.35, gain: 0.14 });
  tone(ac, { type: "triangle", freq: 330, endFreq: 1200, dur: 0.35, gain: 0.05 });
}

function slideWhistleDown(ac: AudioContext) {
  tone(ac, { type: "sine", freq: 980, endFreq: 180, dur: 0.38, gain: 0.14 });
  tone(ac, { type: "triangle", freq: 720, endFreq: 140, dur: 0.38, gain: 0.05 });
}

function clownHorn(ac: AudioContext) {
  honk(ac);
  tone(ac, { type: "square", freq: 240, at: 0.12, dur: 0.18, gain: 0.12 });
  tone(ac, { type: "square", freq: 190, at: 0.22, dur: 0.22, gain: 0.12 });
}

function wahWah(ac: AudioContext) {
  tone(ac, { type: "sawtooth", freq: 400, endFreq: 180, dur: 0.35, gain: 0.13 });
  tone(ac, { type: "sawtooth", freq: 300, endFreq: 140, at: 0.28, dur: 0.4, gain: 0.11 });
}

function raspberry(ac: AudioContext) {
  noiseSweep(ac, { dur: 0.34, gain: 0.2, startFreq: 260, endFreq: 70, q: 3 });
  tone(ac, { type: "sawtooth", freq: 70, endFreq: 48, dur: 0.32, gain: 0.14 });
  tone(ac, { type: "square", freq: 90, endFreq: 55, dur: 0.28, gain: 0.08 });
}

function wetFart(ac: AudioContext) {
  noiseSweep(ac, { dur: 0.5, gain: 0.24, startFreq: 190, endFreq: 48 });
  noiseSweep(ac, { at: 0.1, dur: 0.28, gain: 0.14, startFreq: 140, endFreq: 60, q: 8 });
  tone(ac, { type: "sine", freq: 58, endFreq: 36, dur: 0.48, gain: 0.2 });
  tone(ac, { type: "sawtooth", freq: 82, endFreq: 44, dur: 0.4, gain: 0.07 });
}

function tootFart(ac: AudioContext) {
  tone(ac, { type: "square", freq: 98, endFreq: 68, dur: 0.13, gain: 0.17 });
  noiseSweep(ac, { dur: 0.16, gain: 0.18, startFreq: 240, endFreq: 70 });
  tone(ac, { type: "sine", freq: 72, endFreq: 46, at: 0.1, dur: 0.18, gain: 0.16 });
}

function longFart(ac: AudioContext) {
  noiseSweep(ac, { dur: 0.78, gain: 0.22, startFreq: 170, endFreq: 34, q: 4 });
  tone(ac, { type: "sine", freq: 52, endFreq: 28, dur: 0.78, gain: 0.18 });
  tone(ac, { type: "sawtooth", freq: 88, endFreq: 38, dur: 0.6, gain: 0.07 });
}

function squeakyFart(ac: AudioContext) {
  tone(ac, { type: "square", freq: 260, endFreq: 70, dur: 0.3, gain: 0.12 });
  noiseSweep(ac, { at: 0.04, dur: 0.34, gain: 0.2, startFreq: 420, endFreq: 55, q: 6 });
  tone(ac, { type: "sine", freq: 96, endFreq: 40, at: 0.12, dur: 0.3, gain: 0.15 });
}

function doubleToot(ac: AudioContext) {
  tootFart(ac);
  tone(ac, { type: "square", freq: 84, endFreq: 52, at: 0.24, dur: 0.18, gain: 0.17 });
  noiseSweep(ac, { at: 0.24, dur: 0.2, gain: 0.16, startFreq: 200, endFreq: 48 });
  tone(ac, { type: "sine", freq: 64, endFreq: 38, at: 0.28, dur: 0.18, gain: 0.14 });
}

function rippleFart(ac: AudioContext) {
  [0, 0.1, 0.2, 0.34].forEach((at, i) => {
    noiseSweep(ac, {
      at,
      dur: 0.13,
      gain: 0.16 - i * 0.02,
      startFreq: 210 - i * 28,
      endFreq: 58,
    });
    tone(ac, {
      type: "sine",
      freq: 86 - i * 8,
      endFreq: 42,
      at,
      dur: 0.13,
      gain: 0.11,
    });
  });
}

function goat(ac: AudioContext) {
  tone(ac, { type: "sawtooth", freq: 320, endFreq: 420, dur: 0.12, gain: 0.12 });
  tone(ac, { type: "sawtooth", freq: 400, endFreq: 260, at: 0.1, dur: 0.16, gain: 0.12 });
  tone(ac, { type: "square", freq: 280, endFreq: 180, at: 0.22, dur: 0.18, gain: 0.1 });
}

function catYowl(ac: AudioContext) {
  tone(ac, { type: "sawtooth", freq: 820, endFreq: 240, dur: 0.42, gain: 0.11 });
  tone(ac, { type: "triangle", freq: 940, endFreq: 200, dur: 0.42, gain: 0.06 });
}

function partyHorn(ac: AudioContext) {
  tone(ac, { type: "sawtooth", freq: 400, endFreq: 880, dur: 0.45, gain: 0.1 });
  noiseBurst(ac, 0, 0.45, 0.1, 1800, "bandpass");
  [0.08, 0.18, 0.28, 0.38].forEach((at) => {
    tone(ac, { type: "square", freq: 700 + at * 400, at, dur: 0.08, gain: 0.06 });
  });
}

function baDumTss(ac: AudioContext) {
  tone(ac, { type: "sine", freq: 160, endFreq: 70, dur: 0.16, gain: 0.2 });
  tone(ac, { type: "sine", freq: 220, endFreq: 90, at: 0.16, dur: 0.16, gain: 0.18 });
  noiseBurst(ac, 0.34, 0.28, 0.16, 5000, "highpass");
}

function airhorn(ac: AudioContext) {
  chord(ac, [174, 220, 261], 0, 0.22, 0.22, "sawtooth");
  chord(ac, [174, 220, 261], 0.18, 0.38, 0.2, "sawtooth");
}

function yodel(ac: AudioContext) {
  [523, 784, 523, 880, 659].forEach((freq, i) => {
    tone(ac, { type: "triangle", freq, at: i * 0.09, dur: 0.12, gain: 0.12 });
  });
}

function cartoonZip(ac: AudioContext) {
  tone(ac, { type: "square", freq: 120, endFreq: 1400, dur: 0.22, gain: 0.1 });
  tone(ac, { type: "triangle", freq: 1400, endFreq: 400, at: 0.2, dur: 0.16, gain: 0.08 });
}

function circusSting(ac: AudioContext) {
  chord(ac, [392, 494, 587], 0, 0.16, 0.16);
  chord(ac, [349, 440, 523], 0.14, 0.16, 0.16);
  chord(ac, [523, 659, 784], 0.3, 0.32, 0.18);
}

function cashRegister(ac: AudioContext) {
  noiseBurst(ac, 0, 0.06, 0.1, 3000);
  tone(ac, { type: "square", freq: 1200, at: 0.05, dur: 0.08, gain: 0.08 });
  tone(ac, { type: "square", freq: 1600, at: 0.12, dur: 0.1, gain: 0.08 });
  tone(ac, { type: "triangle", freq: 2000, at: 0.2, dur: 0.22, gain: 0.07 });
}

function bubblePop(ac: AudioContext) {
  [0, 0.07, 0.14, 0.24].forEach((at, i) => {
    tone(ac, { type: "sine", freq: 420 + i * 90, endFreq: 90, at, dur: 0.12, gain: 0.1 });
  });
}

function powerUp(ac: AudioContext) {
  [262, 330, 392, 523, 659, 784].forEach((freq, i) => {
    tone(ac, { type: "square", freq, at: i * 0.05, dur: 0.1, gain: 0.08 });
  });
}

function buzzer(ac: AudioContext) {
  tone(ac, { type: "square", freq: 110, dur: 0.28, gain: 0.14 });
  tone(ac, { type: "square", freq: 146, dur: 0.28, gain: 0.1 });
  noiseBurst(ac, 0, 0.28, 0.06, 800);
}

function glassBreak(ac: AudioContext) {
  noiseBurst(ac, 0, 0.12, 0.18, 4000, "highpass");
  [1800, 2400, 3100, 1500].forEach((freq, i) => {
    tone(ac, { type: "triangle", freq, endFreq: freq * 0.4, at: i * 0.03, dur: 0.18, gain: 0.06 });
  });
}

function wilhelmLite(ac: AudioContext) {
  noiseBurst(ac, 0, 0.35, 0.14, 1600, "bandpass");
  tone(ac, { type: "sawtooth", freq: 700, endFreq: 180, dur: 0.4, gain: 0.12 });
  tone(ac, { type: "square", freq: 900, endFreq: 140, dur: 0.38, gain: 0.06 });
}

function failPiano(ac: AudioContext) {
  [392, 349, 311, 247, 196].forEach((freq, i) => {
    tone(ac, { type: "triangle", freq, at: i * 0.11, dur: 0.2, gain: 0.11 });
  });
}

function bikeHorn(ac: AudioContext) {
  tone(ac, { type: "square", freq: 430, dur: 0.12, gain: 0.14 });
  tone(ac, { type: "square", freq: 340, at: 0.14, dur: 0.22, gain: 0.14 });
}

function cuckoo(ac: AudioContext) {
  tone(ac, { type: "triangle", freq: 659, dur: 0.14, gain: 0.12 });
  tone(ac, { type: "triangle", freq: 523, at: 0.16, dur: 0.18, gain: 0.12 });
}

function hiccup(ac: AudioContext) {
  tone(ac, { type: "sine", freq: 240, endFreq: 420, dur: 0.08, gain: 0.14 });
  tone(ac, { type: "sine", freq: 200, endFreq: 360, at: 0.16, dur: 0.09, gain: 0.12 });
}

function sneeze(ac: AudioContext) {
  noiseBurst(ac, 0, 0.08, 0.08, 900);
  noiseBurst(ac, 0.12, 0.18, 0.2, 2200);
  tone(ac, { type: "triangle", freq: 180, endFreq: 70, at: 0.12, dur: 0.2, gain: 0.1 });
}

function whipCrack(ac: AudioContext) {
  tone(ac, { type: "sawtooth", freq: 1400, endFreq: 180, dur: 0.08, gain: 0.1 });
  noiseBurst(ac, 0.05, 0.1, 0.18, 5000, "highpass");
}

function cowbell(ac: AudioContext) {
  tone(ac, { type: "square", freq: 587, dur: 0.12, gain: 0.08 });
  tone(ac, { type: "square", freq: 845, dur: 0.1, gain: 0.06 });
  noiseBurst(ac, 0, 0.08, 0.08, 2500);
}

function xylophone(ac: AudioContext) {
  [523, 659, 784, 1046].forEach((freq, i) => {
    tone(ac, { type: "triangle", freq, at: i * 0.07, dur: 0.18, gain: 0.11 });
  });
}

function laserPew(ac: AudioContext) {
  tone(ac, { type: "sawtooth", freq: 980, endFreq: 120, dur: 0.18, gain: 0.1 });
  tone(ac, { type: "square", freq: 720, endFreq: 90, dur: 0.16, gain: 0.05 });
}

function whoosh(ac: AudioContext) {
  noiseBurst(ac, 0, 0.28, 0.14, 800, "bandpass");
  tone(ac, { type: "sine", freq: 200, endFreq: 640, dur: 0.28, gain: 0.06 });
}

function rewind(ac: AudioContext) {
  [880, 740, 620, 520, 430, 360, 280].forEach((freq, i) => {
    tone(ac, { type: "square", freq, at: i * 0.04, dur: 0.06, gain: 0.07 });
  });
}

function pageFlip(ac: AudioContext) {
  noiseBurst(ac, 0, 0.08, 0.1, 1800, "highpass");
  noiseBurst(ac, 0.06, 0.1, 0.08, 900);
}

function drumroll(ac: AudioContext) {
  for (let i = 0; i < 10; i++) {
    noiseBurst(ac, i * 0.045, 0.04, 0.08 + i * 0.006, 1800);
  }
  chord(ac, [392, 494, 587], 0.48, 0.35, 0.18);
}

function taDa(ac: AudioContext) {
  chord(ac, [392, 494, 587], 0, 0.18, 0.16);
  chord(ac, [523, 659, 784, 1046], 0.2, 0.45, 0.18);
}

function gameOver(ac: AudioContext) {
  chord(ac, [196, 247, 294], 0, 0.22, 0.14, "sawtooth");
  chord(ac, [175, 220, 262], 0.2, 0.22, 0.14, "sawtooth");
  chord(ac, [147, 185, 220], 0.42, 0.5, 0.16, "sawtooth");
}

function pop(ac: AudioContext) {
  tone(ac, { type: "sine", freq: 420, endFreq: 140, dur: 0.09, gain: 0.12 });
  noiseBurst(ac, 0, 0.05, 0.06, 1800);
}

function blip(ac: AudioContext) {
  tone(ac, { type: "square", freq: 660, dur: 0.06, gain: 0.07 });
  tone(ac, { type: "square", freq: 880, at: 0.05, dur: 0.06, gain: 0.05 });
}

function boing(ac: AudioContext) {
  tone(ac, { type: "sine", freq: 180, endFreq: 520, dur: 0.14, gain: 0.12 });
  tone(ac, { type: "triangle", freq: 520, endFreq: 260, at: 0.12, dur: 0.14, gain: 0.08 });
}

function sparkle(ac: AudioContext) {
  [1200, 1500, 1800, 2100].forEach((freq, i) => {
    tone(ac, { type: "sine", freq, at: i * 0.05, dur: 0.12, gain: 0.06 });
  });
}

function klaxon(ac: AudioContext) {
  tone(ac, { type: "sawtooth", freq: 440, endFreq: 330, dur: 0.16, gain: 0.12 });
  tone(ac, { type: "sawtooth", freq: 330, endFreq: 440, at: 0.16, dur: 0.16, gain: 0.12 });
  tone(ac, { type: "sawtooth", freq: 440, endFreq: 330, at: 0.32, dur: 0.18, gain: 0.12 });
}

function ukulele(ac: AudioContext) {
  [392, 494, 587, 740].forEach((freq, i) => {
    tone(ac, { type: "triangle", freq, at: i * 0.03, dur: 0.28, gain: 0.07 });
  });
}

function thereminWoo(ac: AudioContext) {
  tone(ac, { type: "sine", freq: 300, endFreq: 720, dur: 0.28, gain: 0.1 });
  tone(ac, { type: "sine", freq: 720, endFreq: 240, at: 0.26, dur: 0.32, gain: 0.1 });
}

function bonk(ac: AudioContext) {
  tone(ac, { type: "triangle", freq: 140, endFreq: 70, dur: 0.16, gain: 0.18 });
  noiseBurst(ac, 0, 0.05, 0.1, 600);
}

function rimshot(ac: AudioContext) {
  noiseBurst(ac, 0, 0.05, 0.16, 4000, "highpass");
  tone(ac, { type: "sine", freq: 180, endFreq: 80, dur: 0.12, gain: 0.16 });
}

const CORRECT: Fx[] = [
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
  taDa,
];

const FARTS: Fx[] = [
  wetFart,
  tootFart,
  longFart,
  squeakyFart,
  doubleToot,
  rippleFart,
  raspberry,
];
const TAPS: Fx[] = [pop, blip, cowbell, boing, laserPew];
const AVATARS: Fx[] = [boing, duck, hiccup, sparkle, goat, bubblePop, cartoonZip];
const QUESTIONS: Fx[] = [whoosh, whipCrack, cartoonZip, drumroll, rimshot];
const ANSWERS: Fx[] = [cuckoo, sparkle, xylophone, cashRegister, ukulele];
const CONTINUES: Fx[] = [pop, blip, whoosh, boing, powerUp];
const MCS: Fx[] = [wahWah, thereminWoo, klaxon, partyHorn, slideWhistleDown];

export function ringAlarm() {
  play(clownHorn);
}

export function playCorrectSound() {
  cycle(CORRECT, "correct");
}

export function playWrongSound() {
  cycle(FARTS, "fart");
}

export function playNopeSound() {
  cycle(FARTS, "fart");
}

export function playMultipleChoiceSound() {
  cycle(MCS, "mc");
}

export function playUiTap() {
  cycle(TAPS, "tap");
}

export function playAvatarSound() {
  cycle(AVATARS, "avatar");
}

export function playShowQuestionSound() {
  cycle(QUESTIONS, "question");
}

export function playShowAnswerSound() {
  cycle(ANSWERS, "answer");
}

export function playContinueSound() {
  cycle(CONTINUES, "continue");
}

export function playStartSound() {
  play(drumroll);
}

export function playWinSound() {
  play(taDa);
  play((ac) => {
    partyHorn(ac);
    coinChoir(ac);
  });
}

export function playUndoSound() {
  play(rewind);
}

export function playNextReaderSound() {
  play(whoosh);
  play(ukulele);
}

export function playResetSound() {
  play(gameOver);
}

export function playRulesSound() {
  play(pageFlip);
}

export function playErrorSound() {
  play(buzzer);
}

export function playConfirmSound() {
  play(whipCrack);
}

function woodenSlap(ac: AudioContext) {
  noiseBurst(ac, 0, 0.05, 0.32, 2400, "highpass");
  noiseBurst(ac, 0.01, 0.1, 0.22, 420);
  tone(ac, { type: "triangle", freq: 190, endFreq: 52, dur: 0.14, gain: 0.22 });
  tone(ac, { type: "sine", freq: 78, endFreq: 36, dur: 0.18, gain: 0.12 });
}

function goBlast(ac: AudioContext) {
  tone(ac, { type: "square", freq: 880, dur: 0.1, gain: 0.16 });
  tone(ac, { type: "square", freq: 1174, at: 0.07, dur: 0.16, gain: 0.14 });
  noiseBurst(ac, 0, 0.08, 0.12, 2200, "highpass");
  airhorn(ac);
}

export function playGoSound() {
  play(goBlast);
}

export function playSlapSound() {
  play(woodenSlap);
}
