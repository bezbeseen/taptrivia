let ctx: AudioContext | null = null;
let wrongN = 0;
let correctN = 0;

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

function envGain(ctx: AudioContext, start: number, peak: number, dur: number) {
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  return gain;
}

function tone(
  ctx: AudioContext,
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
  const now = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const amp = envGain(ctx, now, gain, dur);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 20), now + dur);
  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + dur + 0.02);
}

function noiseBurst(ctx: AudioContext, at: number, dur: number, gain: number, lpf = 1200) {
  const frames = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = lpf;
  const amp = envGain(ctx, ctx.currentTime + at, gain, dur);
  src.connect(filter);
  filter.connect(amp);
  amp.connect(ctx.destination);
  src.start(ctx.currentTime + at);
}

function honk(ctx: AudioContext) {
  tone(ctx, { type: "sawtooth", freq: 180, endFreq: 140, dur: 0.22, gain: 0.16 });
  tone(ctx, { type: "square", freq: 360, endFreq: 280, dur: 0.22, gain: 0.08 });
  noiseBurst(ctx, 0, 0.12, 0.08, 700);
}

function duck(ctx: AudioContext) {
  tone(ctx, { type: "square", freq: 420, endFreq: 180, dur: 0.14, gain: 0.14 });
  tone(ctx, { type: "square", freq: 380, endFreq: 140, at: 0.12, dur: 0.16, gain: 0.12 });
}

function sadTrombone(ctx: AudioContext) {
  const notes = [349, 330, 294, 220];
  notes.forEach((freq, i) => {
    tone(ctx, { type: "sawtooth", freq, endFreq: freq - 30, at: i * 0.22, dur: 0.28, gain: 0.12 });
  });
}

function recordScratch(ctx: AudioContext) {
  noiseBurst(ctx, 0, 0.18, 0.18, 2400);
  tone(ctx, { type: "sawtooth", freq: 900, endFreq: 90, dur: 0.22, gain: 0.1 });
}

function splat(ctx: AudioContext) {
  noiseBurst(ctx, 0, 0.2, 0.2, 500);
  tone(ctx, { type: "triangle", freq: 90, endFreq: 40, dur: 0.28, gain: 0.18 });
}

function kazooFanfare(ctx: AudioContext) {
  const notes = [523, 659, 784, 1046];
  notes.forEach((freq, i) => {
    tone(ctx, { type: "square", freq, at: i * 0.09, dur: 0.16, gain: 0.11 });
    tone(ctx, { type: "sawtooth", freq: freq * 1.01, at: i * 0.09, dur: 0.16, gain: 0.04 });
  });
  tone(ctx, { type: "triangle", freq: 1318, at: 0.38, dur: 0.28, gain: 0.1 });
}

function springBoing(ctx: AudioContext) {
  tone(ctx, { type: "sine", freq: 140, endFreq: 720, dur: 0.22, gain: 0.16 });
  tone(ctx, { type: "triangle", freq: 720, endFreq: 420, at: 0.18, dur: 0.22, gain: 0.1 });
  tone(ctx, { type: "square", freq: 880, at: 0.32, dur: 0.12, gain: 0.07 });
}

function coinChoir(ctx: AudioContext) {
  [0, 0.08, 0.16, 0.28].forEach((at, i) => {
    tone(ctx, { type: "square", freq: 880 + i * 120, at, dur: 0.12, gain: 0.09 });
  });
  tone(ctx, { type: "triangle", freq: 1320, at: 0.22, dur: 0.35, gain: 0.08 });
}

function slideWhistleUp(ctx: AudioContext) {
  tone(ctx, { type: "sine", freq: 220, endFreq: 980, dur: 0.35, gain: 0.14 });
  tone(ctx, { type: "triangle", freq: 330, endFreq: 1200, dur: 0.35, gain: 0.05 });
}

function clownHorn(ctx: AudioContext) {
  honk(ctx);
  tone(ctx, { type: "square", freq: 240, at: 0.12, dur: 0.18, gain: 0.12 });
  tone(ctx, { type: "square", freq: 190, at: 0.22, dur: 0.22, gain: 0.12 });
}

function wahWah(ctx: AudioContext) {
  tone(ctx, { type: "sawtooth", freq: 400, endFreq: 180, dur: 0.35, gain: 0.13 });
  tone(ctx, { type: "sawtooth", freq: 300, endFreq: 140, at: 0.28, dur: 0.4, gain: 0.11 });
}

export function ringAlarm() {
  try {
    const ac = audio();
    if (!ac) return;
    clownHorn(ac);
  } catch {
    /* optional */
  }
}

export function playCorrectSound() {
  try {
    const ac = audio();
    if (!ac) return;
    const variants = [kazooFanfare, springBoing, coinChoir, slideWhistleUp];
    variants[correctN % variants.length]!(ac);
    correctN += 1;
  } catch {
    /* optional */
  }
}

export function playWrongSound() {
  try {
    const ac = audio();
    if (!ac) return;
    const variants = [honk, duck, sadTrombone, recordScratch, splat];
    variants[wrongN % variants.length]!(ac);
    wrongN += 1;
  } catch {
    /* optional */
  }
}

export function playMultipleChoiceSound() {
  try {
    const ac = audio();
    if (!ac) return;
    wahWah(ac);
  } catch {
    /* optional */
  }
}

export function playNopeSound() {
  try {
    const ac = audio();
    if (!ac) return;
    duck(ac);
  } catch {
    /* optional */
  }
}
