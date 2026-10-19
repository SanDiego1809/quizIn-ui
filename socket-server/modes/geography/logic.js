const COUNTRY_BANK = require("../../data/geography-questions.json");
const CAPITALS = require("../../data/geography-capitals.json");
const CONTINENT_DATA = require("../../data/geography-continents.json");
const BORDERS = require("../../data/geography-borders.json");
const DIFFICULTY = require("../../data/geography-difficulty.json");
const { shuffle } = require("../../lib/utils");
const { clearRoomTimer } = require("../../lib/timers");
const { FREE_GEOGRAPHY_MAX_QUESTIONS } = require("../../lib/hostLimits");
const {
  isTeamsSettings,
  buildTeamsFromPlayers,
  previewTeams,
  validateTeamsReady,
  participatingPlayers,
  buildFinalResult,
  sanitizeTeamKey,
} = require("../../lib/teams");

const SPEED_POINTS = [10, 8, 7, 5];
const NEIGHBOR_POINTS = 2;
const DEFAULT_LIVES = 3;
/** Always pause this long after a round so players see correct vs their miss. */
const RESULT_REVEAL_MS = 2000;
const PROMPT_VARIANTS = ["countries", "flags", "capitals"];
const FREE_VARIANTS = new Set(["countries", "flags", "capitals", "teams", "mixed"]);
const GEO_VARIANTS = new Set([...FREE_VARIANTS, "streak"]);
const CONTINENT_IDS = new Set(CONTINENT_DATA.continents || []);
const COUNTRY_CONTINENT = CONTINENT_DATA.byCountryCode || {};

function createAnswer(countryCode) {
  return { countryCode, answeredAt: Date.now() };
}

function toBoundedNumber(value, fallback, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function sanitizeBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === 1 || value === "1") return true;
  if (value === "false" || value === 0 || value === "0") return false;
  return Boolean(fallback);
}

function sanitizeVariant(value, fallback = "countries", premium = false) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "versus") return "teams";
  if (!GEO_VARIANTS.has(normalized)) return fallback;
  if (normalized === "streak" && !premium) return fallback;
  return normalized;
}

function sanitizeContinents(input) {
  if (!Array.isArray(input)) return [];
  const seen = new Set();
  const next = [];
  for (const raw of input) {
    const id = String(raw || "").trim().toLowerCase();
    if (!CONTINENT_IDS.has(id) || seen.has(id)) continue;
    seen.add(id);
    next.push(id);
  }
  return next;
}

function sanitizeSettings(input = {}, defaults, options = {}) {
  const premium = Boolean(options.premium);
  const maxQuestions = premium
    ? COUNTRY_BANK.length
    : Math.min(FREE_GEOGRAPHY_MAX_QUESTIONS, COUNTRY_BANK.length);

  const variant = sanitizeVariant(
    input.variant,
    defaults.variant || "countries",
    premium
  );

  const premiumFlag = (key) =>
    premium
      ? sanitizeBoolean(input[key], defaults[key])
      : false;

  return {
    variant,
    continents: premium
      ? sanitizeContinents(input.continents ?? defaults.continents)
      : [],
    harderPool: premiumFlag("harderPool"),
    neighborMiss: premiumFlag("neighborMiss"),
    revealHeat: premiumFlag("revealHeat"),
    lives: premiumFlag("lives"),
    silhouette: premiumFlag("silhouette"),
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
    teams: null,
    result: null,
    livesByPlayer: {},
    eliminatedPlayerIds: [],
    reveal: null,
  };
}

function withCapital(country) {
  return {
    ...country,
    capitalName: CAPITALS[country.countryCode] || null,
  };
}

function isNeighbor(correctCode, guessCode) {
  const correct = String(correctCode || "").toLowerCase();
  const guess = String(guessCode || "").toLowerCase();
  if (!correct || !guess || correct === guess) return false;
  const list = BORDERS[correct];
  return Array.isArray(list) && list.includes(guess);
}

function weightedSample(source, count) {
  const pool = source.map((country) => ({
    country,
    weight: Math.max(0.05, Number(DIFFICULTY[country.countryCode]) || 0.5),
  }));
  const picked = [];
  const remaining = [...pool];
  const target = Math.min(count, remaining.length);

  while (picked.length < target && remaining.length) {
    const total = remaining.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = Math.random() * total;
    let index = remaining.length - 1;
    for (let i = 0; i < remaining.length; i += 1) {
      roll -= remaining[i].weight;
      if (roll <= 0) {
        index = i;
        break;
      }
    }
    picked.push(remaining[index].country);
    remaining.splice(index, 1);
  }
  return picked;
}

function pickCountries(count, continents = [], harderPool = false) {
  const selected = Array.isArray(continents) ? continents : [];
  let source = COUNTRY_BANK;
  if (selected.length > 0) {
    const wanted = new Set(selected);
    const filtered = COUNTRY_BANK.filter((country) =>
      wanted.has(COUNTRY_CONTINENT[String(country.countryCode || "").toLowerCase()])
    );
    if (filtered.length > 0) source = filtered;
  }
  const withCaps = source.map(withCapital);
  if (harderPool) {
    return weightedSample(withCaps, count);
  }
  return shuffle(withCaps).slice(0, Math.min(count, withCaps.length));
}

function assignPromptVariants(countries, roomVariant) {
  if (roomVariant !== "mixed") {
    return countries.map((country) => ({
      ...country,
      promptVariant:
        roomVariant === "flags" || roomVariant === "capitals"
          ? roomVariant
          : "countries",
    }));
  }

  const cues = [];
  for (let i = 0; i < countries.length; i += 1) {
    cues.push(PROMPT_VARIANTS[i % PROMPT_VARIANTS.length]);
  }
  const shuffledCues = shuffle(cues);

  return countries.map((country, index) => {
    let promptVariant = shuffledCues[index] || "countries";
    if (promptVariant === "capitals" && !country.capitalName) {
      promptVariant = Math.random() < 0.5 ? "countries" : "flags";
    }
    return { ...country, promptVariant };
  });
}

function pointsForRank(rank) {
  return SPEED_POINTS[Math.min(rank, SPEED_POINTS.length - 1)];
}

function findCountryByCode(code) {
  const normalized = String(code || "").toLowerCase();
  if (!normalized) return null;
  const country = COUNTRY_BANK.find((c) => c.countryCode === normalized);
  return country ? withCapital(country) : null;
}

function isEliminated(state, playerId) {
  return (state.eliminatedPlayerIds || []).includes(playerId);
}

function activeParticipants(room, state) {
  return participatingPlayers(room, state.teams).filter(
    (player) => !isEliminated(state, player.id)
  );
}

function usesLives(settings) {
  if (String(settings?.variant || "") === "streak") return true;
  return Boolean(settings?.lives);
}

function startingLives(settings) {
  if (String(settings?.variant || "") === "streak") return 1;
  if (settings?.lives) return DEFAULT_LIVES;
  return 0;
}

function scoreQuestion(country, answers, players, neighborMiss) {
  const correctCode = String(country.countryCode || "").toLowerCase();
  const pointsByPlayer = {};
  const kindsByPlayer = {};

  const correctEntries = [];
  for (const player of players) {
    const answer = answers[player.id];
    const guess = answer?.countryCode
      ? String(answer.countryCode).toLowerCase()
      : null;
    if (!guess) {
      kindsByPlayer[player.id] = "wrong";
      continue;
    }
    if (guess === correctCode) {
      correctEntries.push({
        playerId: player.id,
        answeredAt: answer.answeredAt ?? Infinity,
      });
      kindsByPlayer[player.id] = "correct";
    } else if (neighborMiss && isNeighbor(correctCode, guess)) {
      pointsByPlayer[player.id] = NEIGHBOR_POINTS;
      kindsByPlayer[player.id] = "neighbor";
    } else {
      kindsByPlayer[player.id] = "wrong";
    }
  }

  correctEntries
    .sort((a, b) => a.answeredAt - b.answeredAt)
    .forEach((entry, rank) => {
      pointsByPlayer[entry.playerId] = pointsForRank(rank);
    });

  return { pointsByPlayer, kindsByPlayer };
}

function allActivePlayersAnswered(room, state) {
  const answers = state.answersByQuestion[state.currentQuestionIndex] || {};
  const participants = activeParticipants(room, state);
  if (!participants.length) return true;
  return participants.every((p) => answers[p.id] !== undefined);
}

function applyScoresForCurrentQuestion(room, state) {
  const country = state.countries[state.currentQuestionIndex];
  if (!country) return;

  const answers = state.answersByQuestion[state.currentQuestionIndex] || {};
  const participants = participatingPlayers(room, state.teams);
  const { pointsByPlayer, kindsByPlayer } = scoreQuestion(
    country,
    answers,
    participants,
    Boolean(room.settings.neighborMiss)
  );

  for (const player of participants) {
    const points = pointsByPlayer[player.id] || 0;
    state.scores[player.id] = (state.scores[player.id] || 0) + points;
    if (answers[player.id]) {
      answers[player.id].kind = kindsByPlayer[player.id] || "wrong";
    }
  }

  if (usesLives(room.settings)) {
    for (const player of participants) {
      if (isEliminated(state, player.id)) continue;
      const kind = kindsByPlayer[player.id] || "wrong";
      if (kind === "correct" || kind === "neighbor") continue;
      const remaining = Math.max(0, (state.livesByPlayer[player.id] ?? 0) - 1);
      state.livesByPlayer[player.id] = remaining;
      if (remaining <= 0 && !state.eliminatedPlayerIds.includes(player.id)) {
        state.eliminatedPlayerIds.push(player.id);
      }
    }
  }

  state.answersByQuestion[state.currentQuestionIndex] = answers;
}

function buildRevealPayload(room, state) {
  const country = state.countries[state.currentQuestionIndex];
  if (!country) return null;
  const answers = state.answersByQuestion[state.currentQuestionIndex] || {};
  const clicks = Object.entries(answers)
    .filter(([, answer]) => answer?.countryCode)
    .map(([playerId, answer]) => ({
      playerId,
      countryCode: String(answer.countryCode).toLowerCase(),
      kind: answer.kind || null,
    }));
  return {
    correctCode: String(country.countryCode).toLowerCase(),
    clicks,
  };
}

function finalizeGame(room, state) {
  clearRoomTimer(room);
  room.phase = "final_results";
  room.phaseDeadline = null;
  state.reveal = null;

  state.result = buildFinalResult(room, state, {
    totalQuestions: state.countries.length,
    pointsPerWin: SPEED_POINTS[0],
  });

  try {
    const { persistGameResults } = require("../../lib/persistGameResults");
    void persistGameResults(room);
  } catch (err) {
    console.error("[geography.finalizeGame] persist failed", err);
  }
}

function goToNextQuestion(roomCode, ctx) {
  const room = ctx.rooms.get(roomCode);
  if (!room || (room.phase !== "playing" && room.phase !== "reveal")) return;

  const state = room.state;
  state.reveal = null;

  if (state.currentQuestionIndex >= state.countries.length - 1) {
    finalizeGame(room, state);
    ctx.emitRoom(roomCode);
    return;
  }

  // If everyone is eliminated before the last question, end early.
  if (usesLives(room.settings) && activeParticipants(room, state).length === 0) {
    finalizeGame(room, state);
    ctx.emitRoom(roomCode);
    return;
  }

  room.phase = "playing";
  state.currentQuestionIndex += 1;
  scheduleQuestionTimer(roomCode, ctx);
  ctx.emitRoom(roomCode);
}

function scheduleReveal(roomCode, ctx) {
  const room = ctx.rooms.get(roomCode);
  if (!room) return;

  const state = room.state;
  clearRoomTimer(room);
  room.phase = "reveal";
  state.reveal = buildRevealPayload(room, state);
  room.phaseDeadline = Date.now() + RESULT_REVEAL_MS;
  room.phaseTimeoutId = setTimeout(() => {
    goToNextQuestion(roomCode, ctx);
  }, RESULT_REVEAL_MS);
  ctx.emitRoom(roomCode);
}

function advanceQuestion(roomCode, ctx) {
  const room = ctx.rooms.get(roomCode);
  if (!room || room.phase !== "playing") return;

  const state = room.state;
  applyScoresForCurrentQuestion(room, state);
  // Always show a short result beat (solo after click, multi after last answer).
  scheduleReveal(roomCode, ctx);
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
    const participants = activeParticipants(current, current.state);
    for (const player of participants) {
      if (answers[player.id] === undefined) {
        answers[player.id] = { countryCode: null, answeredAt: deadline };
      }
    }
    current.state.answersByQuestion[questionIndex] = answers;
    advanceQuestion(roomCode, ctx);
  }, seconds * 1000);
}

function validateStart(room) {
  if (!isTeamsSettings(room.settings)) return { ok: true };
  return validateTeamsReady(room.players);
}

function beginGame(room) {
  clearRoomTimer(room);
  const state = room.state;
  const settings = room.settings;
  const countries = assignPromptVariants(
    pickCountries(
      settings.questionsPerGame,
      settings.continents,
      Boolean(settings.harderPool)
    ),
    settings.variant
  );
  const teams = isTeamsSettings(settings)
    ? buildTeamsFromPlayers(room.players)
    : null;
  const participants = participatingPlayers(room, teams);
  const lives = startingLives(settings);

  room.phase = "playing";
  state.countries = countries;
  state.currentQuestionIndex = 0;
  state.answersByQuestion = countries.map(() => ({}));
  state.teams = teams;
  state.scores = Object.fromEntries(participants.map((p) => [p.id, 0]));
  state.livesByPlayer = Object.fromEntries(
    participants.map((p) => [p.id, lives])
  );
  state.eliminatedPlayerIds = [];
  state.reveal = null;
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
  if (isEliminated(state, playerId)) {
    return { ok: false, message: "You are out for this game." };
  }
  if (
    state.teams?.length &&
    !state.teams.some((team) => team.playerIds.includes(playerId))
  ) {
    return { ok: false, message: "You are not on a team this round." };
  }

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

  if (allActivePlayersAnswered(room, state)) {
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
  validateStart,
  start,
  handleAction,
  reset,
  findCountryByCode,
  advanceQuestion,
  scheduleQuestionTimer,
  previewTeams,
  sanitizeTeamKey,
  isNeighbor,
  NEIGHBOR_POINTS,
  DEFAULT_LIVES,
  RESULT_REVEAL_MS,
};
