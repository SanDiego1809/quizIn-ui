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
    if (kind === "lock" || kind === "vote_locked") {
      tone(520, 0.08, "triangle", 0.06);
      tone(780, 0.1, "triangle", 0.05);
    } else if (kind === "correct" || kind === "mr_white_correct") {
      tone(523, 0.1, "sine", 0.07);
      setTimeout(() => tone(659, 0.12, "sine", 0.07), 70);
      setTimeout(() => tone(784, 0.18, "sine", 0.08), 140);
    } else if (kind === "wrong") {
      tone(220, 0.22, "sawtooth", 0.05);
    } else if (kind === "tick") {
      tone(880, 0.04, "square", 0.03);
    } else if (kind === "your_turn") {
      tone(440, 0.09, "triangle", 0.06);
      setTimeout(() => tone(660, 0.12, "triangle", 0.05), 80);
    } else if (kind === "elimination") {
      tone(180, 0.28, "sawtooth", 0.05);
      setTimeout(() => tone(140, 0.35, "sine", 0.06), 90);
    } else if (kind === "blank_round") {
      tone(300, 0.12, "sine", 0.05);
      setTimeout(() => tone(240, 0.16, "triangle", 0.05), 100);
      setTimeout(() => tone(360, 0.2, "sine", 0.04), 200);
    }
  } catch {
    /* ignore autoplay / AudioContext errors */
  }
}
