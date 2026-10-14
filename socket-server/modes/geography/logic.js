const COUNTRY_BANK = require("../../data/geography-questions.json");
const { shuffle } = require("../../lib/utils");
const { clearRoomTimer } = require("../../lib/timers");
const { FREE_GEOGRAPHY_MAX_QUESTIONS } = require("../../lib/hostLimits");

const SPEED_POINTS = [10, 8, 7, 5];

function createAnswer(countryCode) {
  return { countryCode, answeredAt: Date.now() };
}

function toBoundedNumber(value, fallback, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function sanitizeSettings(input = {}, defaults, options = {}) {
  const premium = Boolean(options.premium);
  const maxQuestions = premium
    ? COUNTRY_BANK.length
    : Math.min(FREE_GEOGRAPHY_MAX_QUESTIONS, COUNTRY_BANK.length);

  return {
    questionTimeSeconds: toBoundedNumber(
      input.questionTimeSeconds,
      defaults.questionTimeSeconds,
      0,
      300
    ),
    questionsPerGame: toBoundedNumber(
      input.questionsPerGame,
      defaults.questionsPerGame,
      1,
      maxQuestions
    ),
  };
}

function createInitialState() {
  return {
    countries: [],
    currentQuestionIndex: 0,
    answersByQuestion: [],
    scores: {},
    result: null,
  };
}

function pickCountries(count) {
  const pool = shuffle(COUNTRY_BANK);
  return pool.slice(0, Math.min(count, pool.length));
}

function pointsForRank(rank) {
  return SPEED_POINTS[Math.min(rank, SPEED_POINTS.length - 1)];
}

function findCountryByCode(code) {
  const normalized = String(code || "").toLowerCase();
  if (!normalized) return null;
  return COUNTRY_BANK.find((c) => c.countryCode === normalized) || null;
}

function scoreQuestionBySpeed(country, answers, players) {
  const correctPlayers = players
    .map((player) => {
      const answer = answers[player.id];
      return {
        playerId: player.id,
        countryCode: answer ? answer.countryCode : null,
        answeredAt: answer ? answer.answeredAt : Infinity,
      };
    })
    .filter(
      (entry) =>
        entry.countryCode && entry.countryCode === country.countryCode
    )
    .sort((a, b) => a.answeredAt - b.answeredAt);

  const pointsByPlayer = {};
  correctPlayers.forEach((entry, rank) => {
    pointsByPlayer[entry.playerId] = pointsForRank(rank);
  });
  return pointsByPlayer;
}

function allPlayersAnswered(room, state) {
  const answers = state.answersByQuestion[state.currentQuestionIndex] || {};
  return room.players.every((p) => answers[p.id] !== undefined);
}

function applyScoresForCurrentQuestion(room, state) {
  const country = state.countries[state.currentQuestionIndex];
  if (!country) return;

  const answers = state.answersByQuestion[state.currentQuestionIndex] || {};
  const pointsByPlayer = scoreQuestionBySpeed(country, answers, room.players);

  for (const player of room.players) {
    const points = pointsByPlayer[player.id] || 0;
    state.scores[player.id] = (state.scores[player.id] || 0) + points;
  }
}

function finalizeGame(room, state) {
  clearRoomTimer(room);
  room.phase = "final_results";
  room.phaseDeadline = null;

  const rankings = room.players
    .map((p) => ({
      playerId: p.id,
      name: p.name,
      score: state.scores[p.id] || 0,
    }))
    .sort((a, b) => b.score - a.score);

  state.result = {
    rankings,
    totalQuestions: state.countries.length,
    maxScore: state.countries.length * SPEED_POINTS[0],
  };

  try {
    const { persistGameResults } = require("../../lib/persistGameResults");
    void persistGameResults(room);
  } catch (err) {
    console.error("[geography.finalizeGame] persist failed", err);
  }
}

function advanceQuestion(roomCode, ctx) {
  const room = ctx.rooms.get(roomCode);
  if (!room || room.phase !== "playing") return;

  const state = room.state;
  applyScoresForCurrentQuestion(room, state);

  if (state.currentQuestionIndex >= state.countries.length - 1) {
    finalizeGame(room, state);
    ctx.emitRoom(roomCode);
    return;
  }

  state.currentQuestionIndex += 1;
  scheduleQuestionTimer(roomCode, ctx);
  ctx.emitRoom(roomCode);
}

function scheduleQuestionTimer(roomCode, ctx) {
  const room = ctx.rooms.get(roomCode);
  if (!room || room.phase !== "playing") return;

  clearRoomTimer(room);

  const seconds = room.settings.questionTimeSeconds;
  if (seconds <= 0) {
    room.phaseDeadline = null;
    return;
  }

  const state = room.state;
  const questionIndex = state.currentQuestionIndex;
  room.phaseDeadline = Date.now() + seconds * 1000;
  room.phaseTimeoutId = setTimeout(() => {
    const current = ctx.rooms.get(roomCode);
    if (!current || current.phase !== "playing") return;
    if (current.state.currentQuestionIndex !== questionIndex) return;

    const answers = current.state.answersByQuestion[questionIndex] || {};
    const deadline = current.phaseDeadline ?? Date.now();
    for (const player of current.players) {
      if (answers[player.id] === undefined) {
        answers[player.id] = { countryCode: null, answeredAt: deadline };
      }
    }
    current.state.answersByQuestion[questionIndex] = answers;
    advanceQuestion(roomCode, ctx);
  }, seconds * 1000);
}

function beginGame(room) {
  clearRoomTimer(room);
  const state = room.state;
  const countries = pickCountries(room.settings.questionsPerGame);

  room.phase = "playing";
  state.countries = countries;
  state.currentQuestionIndex = 0;
  state.answersByQuestion = countries.map(() => ({}));
  state.scores = Object.fromEntries(room.players.map((p) => [p.id, 0]));
  state.result = null;
  room.phaseDeadline = null;
}

function start(room, ctx) {
  beginGame(room);
  scheduleQuestionTimer(room.code, ctx);
}

function handleAction(room, action, ctx) {
  if (action.type === "submit_country") {
    return submitAnswer(room, action.playerId, action.countryCode, ctx);
  }
  return { ok: false, message: "Unknown action for geography mode." };
}

function submitAnswer(room, playerId, countryCode, ctx) {
  if (room.phase !== "playing") {
    return { ok: false, message: "Game is not in progress." };
  }

  const state = room.state;
  const country = state.countries[state.currentQuestionIndex];
  if (!country) return { ok: false, message: "No active question." };

  const normalized = String(countryCode || "").toLowerCase();
  if (!normalized) {
    return { ok: false, message: "Click a country on the map." };
  }

  const answers = state.answersByQuestion[state.currentQuestionIndex] || {};
  if (answers[playerId] !== undefined) {
    return { ok: false, message: "You already answered this question." };
  }

  answers[playerId] = createAnswer(normalized);
  state.answersByQuestion[state.currentQuestionIndex] = answers;

  if (allPlayersAnswered(room, state)) {
    clearRoomTimer(room);
    room.phaseDeadline = null;
    advanceQuestion(room.code, ctx);
  }

  return { ok: true };
}

function reset(room) {
  clearRoomTimer(room);
  room.phase = "lobby";
  room.state = createInitialState();
  room.phaseDeadline = null;
}

module.exports = {
  sanitizeSettings,
  createInitialState,
  start,
  handleAction,
  reset,
  findCountryByCode,
  advanceQuestion,
  scheduleQuestionTimer,
};
