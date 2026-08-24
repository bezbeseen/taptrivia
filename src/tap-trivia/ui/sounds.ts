function playTone(
  freq: number,
  start: number,
  duration: number,
  volume = 0.16,
  type: OscillatorType = "sine",
  endFreq: number | null = null
) {
  const Ctor =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return;
  const ctx = new Ctor();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
  if (endFreq) {
    osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + start + duration);
  }
  gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime + start);
  osc.stop(ctx.currentTime + start + duration + 0.02);
}

export function playCorrect() {
  playTone(880, 0, 0.14, 0.18);
  playTone(1175, 0.18, 0.18, 0.18);
  playTone(1568, 0.39, 0.26, 0.2);
}

export function playWrong() {
  playTone(260, 0, 0.22, 0.2, "sawtooth", 190);
  playTone(190, 0.2, 0.25, 0.18, "sawtooth", 125);
  playTone(125, 0.42, 0.38, 0.16, "sawtooth", 72);
}

export function playWinner() {
  const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.51];
  notes.forEach((freq, index) => {
    playTone(freq, index * 0.13, index === notes.length - 1 ? 0.55 : 0.2, 0.19, "triangle");
  });
}
