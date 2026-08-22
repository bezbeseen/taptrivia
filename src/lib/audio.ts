type Tone = {
  freq: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
};

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtx) return null;
  if (!ctx) ctx = new AudioCtx();
  return ctx;
}

export async function unlockAudio(): Promise<void> {
  const audio = getContext();
  if (audio?.state === "suspended") {
    await audio.resume();
  }
}

function playTone({ freq, duration, type = "square", gain = 0.08 }: Tone) {
  const audio = getContext();
  if (!audio) return;
  const osc = audio.createOscillator();
  const amp = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  amp.gain.setValueAtTime(gain, audio.currentTime);
  amp.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration);
  osc.connect(amp);
  amp.connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + duration);
}

export function playCue() {
  playTone({ freq: 880, duration: 0.12, type: "square", gain: 0.09 });
}

export function playFeint() {
  playTone({ freq: 220, duration: 0.05, type: "triangle", gain: 0.04 });
}

export function playSlap(kind: "perfect" | "hit" | "early") {
  if (kind === "perfect") {
    playTone({ freq: 660, duration: 0.08, type: "sawtooth", gain: 0.07 });
    playTone({ freq: 990, duration: 0.1, type: "square", gain: 0.05 });
    return;
  }
  if (kind === "early") {
    playTone({ freq: 140, duration: 0.16, type: "triangle", gain: 0.08 });
    return;
  }
  playTone({ freq: 90, duration: 0.22, type: "sawtooth", gain: 0.1 });
}

export function vibrate(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    navigator.vibrate(pattern);
  }
}
