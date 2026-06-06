const DEFAULT_SETTINGS = {
  /** Seconds per question; 0 = no timer */
  questionTimeSeconds: 30,
  questionsPerGame: 4,
};

function parsePort() {
  const v = process.env.QUIZIN_SOCKET_PORT;
  return Number(v) || 4000;
}

function parseHost() {
  return process.env.HOST || "0.0.0.0";
}

/** 0 = disable idle disconnect */
function parseSocketIdleMs() {
  const v = process.env.QUIZIN_SOCKET_IDLE_MS;
  if (v === undefined || v === "") return 30 * 60 * 1000;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 30 * 60 * 1000;
}

function parseCorsOrigins() {
  if (process.env.QUIZIN_CORS_ORIGIN === "*") {
    return true;
  }

  const raw =
    process.env.NEXT_PUBLIC_APP_ORIGIN ||
    "http://localhost:3000,http://127.0.0.1:3000";
  const origins = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (process.env.NODE_ENV !== "production") {
    return (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (origins.includes(origin)) {
        callback(null, true);
        return;
      }
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    };
  }

  return origins;
}

module.exports = {
  DEFAULT_SETTINGS,
  PORT: parsePort(),
  HOST: parseHost(),
  SOCKET_IDLE_MS: parseSocketIdleMs(),
  CORS_ORIGINS: parseCorsOrigins(),
};
