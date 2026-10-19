/** Lightweight Web Audio stings — no asset files. Muted unless audioPack is on. */

let audioCtx = null;

function getCtx() {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
  }
  return audioCtx;
}

function tone(freq, duration, type = "sine", gain = 0.08) {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    void ctx.resume();
  }
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  amp.gain.value = gain;
  amp.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

export function playQuizSfx(kind, enabled) {
  if (!enabled) return;
  try {
    if (kind === "lock") {
      tone(520, 0.08, "triangle", 0.06);
      tone(780, 0.1, "triangle", 0.05);
    } else if (kind === "correct") {
      tone(523, 0.1, "sine", 0.07);
      setTimeout(() => tone(659, 0.12, "sine", 0.07), 70);
      setTimeout(() => tone(784, 0.18, "sine", 0.08), 140);
    } else if (kind === "wrong") {
      tone(220, 0.22, "sawtooth", 0.05);
    } else if (kind === "tick") {
      tone(880, 0.04, "square", 0.03);
    }
  } catch {
    /* ignore autoplay / AudioContext errors */
  }
}
