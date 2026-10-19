const QUESTION_BANK = require("../../data/questions.json");
const { shuffle } = require("../../lib/utils");
const { clearRoomTimer } = require("../../lib/timers");
const { isKnownCategory } = require("../../lib/classicCategories");
const {
  FREE_CLASSIC_MAX_QUESTIONS,
  PREMIUM_CLASSIC_MAX_QUESTIONS,
} = require("../../lib/hostLimits");
const {
  isTeamsSettings,
  buildTeamsFromPlayers,
  validateTeamsReady,
  participatingPlayers,
  buildFinalResult,
} = require("../../lib/teams");
const { getCommunityDifficulty } = require("../../lib/questionFeedback");

const SPEED_POINTS = [10, 8, 7, 5];
const FLAT_POINTS = 10;
const RESULT_REVEAL_MS = 2200;
const CLASSIC_VARIANTS = new Set(["solo", "teams"]);
const SCORING_MODES = new Set(["speed", "flat", "sudden_death"]);
const DIFFICULTIES = new Set(["all", "easy", "medium", "hard"]);
const PULPIT_KITS = new Set(["gold", "neon", "wood", "chrome"]);

function getOptionIndex(answer) {
  if (answer == null) return undefined;
  if (typeof answer === "object") return answer.optionIndex;
  return answer;
}

function createAnswer(optionIndex) {
  return { optionIndex, answeredAt: Date.now() };
}

function toBoundedNumber(value, fallback, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function sanitizeVariant(value, fallback = "solo") {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "versus") return "teams";
  return CLASSIC_VARIANTS.has(normalized) ? normalized : fallback;
}

function sanitizeEnum(value, allowed, fallback) {
  const normalized = String(value || "").trim().toLowerCase();
  return allowed.has(normalized) ? normalized : fallback;
}

function sanitizeCategories(input) {
  let list = input;
  if (typeof list === "string" && list.trim()) {
    list = [list];
  }
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const next = [];
  for (const raw of list) {
    const id = String(raw || "").trim();
    if (!isKnownCategory(id) || seen.has(id)) continue;
    seen.add(id);
    next.push(id);
  }
  return next;
}

function sanitizeSettings(input = {}, defaults, options = {}) {
  const premium = Boolean(options.premium);
  const maxQuestions = premium
    ? PREMIUM_CLASSIC_MAX_QUESTIONS
    : FREE_CLASSIC_MAX_QUESTIONS;

  const freeDifficulty = defaults.difficulty || "all";
  const freeScoring = defaults.scoringMode || "speed";
  const freePulpit = defaults.pulpitKit || "gold";

  return {
    variant: sanitizeVariant(input.variant, defaults.variant || "solo"),
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
    category: premium
      ? sanitizeCategories(input.category ?? defaults.category)
      : [],
    difficulty: premium
      ? sanitizeEnum(input.difficulty, DIFFICULTIES, freeDifficulty)
      : freeDifficulty,
    scoringMode: premium
      ? sanitizeEnum(input.scoringMode, SCORING_MODES, freeScoring)
      : freeScoring,
    buzzerRace: premium
      ? Boolean(input.buzzerRace ?? defaults.buzzerRace ?? false)
      : false,
    hostPacing: premium
      ? Boolean(input.hostPacing ?? defaults.hostPacing ?? false)
      : false,
    pulpitKit: premium
      ? sanitizeEnum(input.pulpitKit, PULPIT_KITS, freePulpit)
      : freePulpit,
    audioPack: premium
      ? Boolean(input.audioPack ?? defaults.audioPack ?? false)
      : false,
  };
}

function createInitialState() {
  return {
    questions: [],
    currentQuestionIndex: 0,
    answersByQuestion: [],
    scores: {},
    teams: null,
    result: null,
    reveal: null,
    eliminatedPlayerIds: [],
    buzzLocked: false,
  };
}

function questionDifficulty(question) {
  // Community tier only when sample + ratio thresholds are met; else null.
  const community = getCommunityDifficulty(question.id);
  if (community) return community;
  if (question.difficulty && DIFFICULTIES.has(question.difficulty)) {
    return question.difficulty;
  }
  // Under-sample / unrated and no author difficulty — medium until rated.
  return "medium";
}

function buildRevealPayload(room, state) {
  const question = state.questions[state.currentQuestionIndex];
  const answers = state.answersByQuestion[state.currentQuestionIndex] || {};
  const participants = participatingPlayers(room, state.teams);
  const pointsByPlayer = scoreQuestion(
    question,
    answers,
    participants,
    room.settings.scoringMode || "speed"
  );
  return {
    correctIndex: question?.correctIndex ?? null,
    pointsByPlayer,
  };
}

function pickQuestions(
  count,
  categories = [],
  difficulty = "all",
  bank = QUESTION_BANK
) {
  const selected = Array.isArray(categories)
    ? categories.filter((id) => isKnownCategory(id))
    : typeof categories === "string" && categories.trim()
      ? [categories.trim()]
      : [];
  let filtered = selected.length
    ? bank.filter((question) => selected.includes(question.category))
    : bank.slice();
  if (difficulty && difficulty !== "all") {
    // Prefer questions that meet community ratio tiers (Idea B).
    const tiered = filtered.filter(
      (question) => questionDifficulty(question) === difficulty
    );
    if (tiered.length) {
      filtered = tiered;
    } else if (difficulty === "easy" || difficulty === "hard") {
      // Too few ratio-classified easy/hard: stay in the medium band
      // (includes unrated) rather than mixing in the opposite extreme.
      const mediumBand = filtered.filter(
        (question) => questionDifficulty(question) === "medium"
      );
      if (mediumBand.length) filtered = mediumBand;
      // else keep category-filtered pool; full bank only if that is empty below
    }
  }
  const source = filtered.length ? filtered : bank;
  const pool = shuffle(source);
  return pool.slice(0, Math.min(count, pool.length));
}

function pointsForRank(rank) {
  return SPEED_POINTS[Math.min(rank, SPEED_POINTS.length - 1)];
}

function scoreQuestion(question, answers, players, scoringMode = "speed") {
  const correctPlayers = players
    .map((player) => {
      const answer = answers[player.id];
      return {
        playerId: player.id,
        optionIndex: getOptionIndex(answer),
        answeredAt: answer ? answer.answeredAt : Infinity,
      };
    })
    .filter(
      (entry) =>
        entry.optionIndex != null &&
        entry.optionIndex >= 0 &&
        entry.optionIndex === question.correctIndex
    )
    .sort((a, b) => a.answeredAt - b.answeredAt);

  const pointsByPlayer = {};
  if (scoringMode === "flat" || scoringMode === "sudden_death") {
    correctPlayers.forEach((entry) => {
      pointsByPlayer[entry.playerId] = FLAT_POINTS;
    });
  } else {
    correctPlayers.forEach((entry, rank) => {
      pointsByPlayer[entry.playerId] = pointsForRank(rank);
    });
  }
  return pointsByPlayer;
}

function activeParticipants(room, state) {
  const participants = participatingPlayers(room, state.teams);
  if (room.settings.scoringMode !== "sudden_death") return participants;
  const out = new Set(state.eliminatedPlayerIds || []);
  return participants.filter((p) => !out.has(p.id));
}

/**
 * Sudden death ends when nobody is left, or when only one survivor remains
 * in a multiplayer match (competition over). Solo keeps going until that
 * player is eliminated.
 */
function shouldEndSuddenDeath(room, state) {
  if (room.settings.scoringMode !== "sudden_death") return false;
  const total = participatingPlayers(room, state.teams).length;
  const alive = activeParticipants(room, state).length;
  if (total <= 1) return alive === 0;
  return alive <= 1;
}

function allPlayersAnswered(room, state) {
  const answers = state.answersByQuestion[state.currentQuestionIndex] || {};
  const participants = activeParticipants(room, state);
  return participants.every((p) => answers[p.id] !== undefined);
}

function applySuddenDeathEliminations(room, state) {
  if (room.settings.scoringMode !== "sudden_death") return;
  const question = state.questions[state.currentQuestionIndex];
  const answers = state.answersByQuestion[state.currentQuestionIndex] || {};
  const out = new Set(state.eliminatedPlayerIds || []);
  for (const player of participatingPlayers(room, state.teams)) {
    if (out.has(player.id)) continue;
    const idx = getOptionIndex(answers[player.id]);
    if (idx == null || idx < 0 || idx !== question.correctIndex) {
      out.add(player.id);
    }
  }
  state.eliminatedPlayerIds = [...out];
}

function applyScoresForCurrentQuestion(room, state) {
  const question = state.questions[state.currentQuestionIndex];
  if (!question) return;

  const answers = state.answersByQuestion[state.currentQuestionIndex] || {};
  const participants = participatingPlayers(room, state.teams);
  const pointsByPlayer = scoreQuestion(
    question,
    answers,
    participants,
    room.settings.scoringMode || "speed"
  );

  for (const player of participants) {
    const points = pointsByPlayer[player.id] || 0;
    state.scores[player.id] = (state.scores[player.id] || 0) + points;
  }
  applySuddenDeathEliminations(room, state);
}

function finalizeGame(room, state) {
  clearRoomTimer(room);
  room.phase = "final_results";
  room.phaseDeadline = null;
  state.reveal = null;
  state.buzzLocked = false;

  state.result = buildFinalResult(room, state, {
    totalQuestions: state.questions.length,
    pointsPerWin: SPEED_POINTS[0],
  });

  try {
    const { persistGameResults } = require("../../lib/persistGameResults");
    void persistGameResults(room);
  } catch (err) {
    console.error("[classic.finalizeGame] persist failed", err);
  }
}

function goToNextQuestion(roomCode, ctx) {
  const room = ctx.rooms.get(roomCode);
  if (!room || (room.phase !== "playing" && room.phase !== "reveal")) return;

  const state = room.state;
  state.reveal = null;
  state.buzzLocked = false;

  if (state.currentQuestionIndex >= state.questions.length - 1) {
    finalizeGame(room, state);
    ctx.emitRoom(roomCode);
    return;
  }

  if (shouldEndSuddenDeath(room, state)) {
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

  if (room.settings.hostPacing) {
    room.phaseDeadline = null;
    room.phaseTimeoutId = null;
    ctx.emitRoom(roomCode);
    return;
  }

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
        answers[player.id] = { optionIndex: -1, answeredAt: deadline };
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

function beginGame(room, startOptions = {}) {
  clearRoomTimer(room);
  const state = room.state;
  const bank = startOptions.questionBank || QUESTION_BANK;
  const questions = pickQuestions(
    room.settings.questionsPerGame,
    room.settings.category,
    room.settings.difficulty || "all",
    bank
  );
  const teams = isTeamsSettings(room.settings)
    ? buildTeamsFromPlayers(room.players)
    : null;

  room.phase = "playing";
  state.questions = questions;
  state.currentQuestionIndex = 0;
  state.answersByQuestion = questions.map(() => ({}));
  state.teams = teams;
  state.scores = Object.fromEntries(
    participatingPlayers(room, teams).map((p) => [p.id, 0])
  );
  state.result = null;
  state.reveal = null;
  state.eliminatedPlayerIds = [];
  state.buzzLocked = false;
  room.phaseDeadline = null;
}

function start(room, ctx, startOptions = {}) {
  beginGame(room, startOptions);
  scheduleQuestionTimer(room.code, ctx);
}

function handleAction(room, action, ctx) {
  if (action.type === "submit_answer") {
    return submitAnswer(room, action.playerId, action.optionIndex, ctx);
  }
  if (action.type === "advance_round") {
    return hostAdvance(room, action.playerId, ctx);
  }
  return { ok: false, message: "Unknown action for classic mode." };
}

function hostAdvance(room, playerId, ctx) {
  if (!room.settings.hostPacing) {
    return { ok: false, message: "Host pacing is off." };
  }
  if (room.hostId !== playerId) {
    return { ok: false, message: "Only the host can advance." };
  }
  if (room.phase !== "reveal") {
    return { ok: false, message: "Nothing to advance yet." };
  }
  goToNextQuestion(room.code, ctx);
  return { ok: true };
}

function submitAnswer(room, playerId, optionIndex, ctx) {
  if (room.phase !== "playing") {
    return { ok: false, message: "Game is not in progress." };
  }

  const state = room.state;
  if (state.buzzLocked) {
    return { ok: false, message: "Buzzers are locked for this question." };
  }

  if ((state.eliminatedPlayerIds || []).includes(playerId)) {
    return { ok: false, message: "You are eliminated (sudden death)." };
  }

  if (
    state.teams?.length &&
    !state.teams.some((team) => team.playerIds.includes(playerId))
  ) {
    return { ok: false, message: "You are not on a team this round." };
  }

  const question = state.questions[state.currentQuestionIndex];
  if (!question) return { ok: false, message: "No active question." };

  const idx = Number(optionIndex);
  if (!Number.isInteger(idx) || idx < 0 || idx >= question.options.length) {
    return { ok: false, message: "Pick one of the listed answers." };
  }

  const answers = state.answersByQuestion[state.currentQuestionIndex] || {};
  if (answers[playerId] !== undefined) {
    return { ok: false, message: "You already answered this question." };
  }

  answers[playerId] = createAnswer(idx);
  state.answersByQuestion[state.currentQuestionIndex] = answers;

  if (room.settings.buzzerRace && idx === question.correctIndex) {
    state.buzzLocked = true;
    const deadline = Date.now();
    for (const player of activeParticipants(room, state)) {
      if (answers[player.id] === undefined) {
        answers[player.id] = { optionIndex: -1, answeredAt: deadline };
      }
    }
    state.answersByQuestion[state.currentQuestionIndex] = answers;
    clearRoomTimer(room);
    room.phaseDeadline = null;
    advanceQuestion(room.code, ctx);
    return { ok: true };
  }

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
  validateStart,
  start,
  handleAction,
  reset,
  advanceQuestion,
  scheduleQuestionTimer,
  pickQuestions,
  QUESTION_BANK,
};
