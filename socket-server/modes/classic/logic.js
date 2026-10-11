const QUESTION_BANK = require("../../data/questions.json");
const { shuffle } = require("../../lib/utils");
const { clearRoomTimer } = require("../../lib/timers");

const SPEED_POINTS = [10, 8, 7, 5];

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

function sanitizeSettings(input = {}, defaults) {
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
      25
    ),
  };
}

function createInitialState() {
  return {
    questions: [],
    currentQuestionIndex: 0,
    answersByQuestion: [],
    scores: {},
    result: null,
  };
}

function pickQuestions(count) {
  const pool = shuffle(QUESTION_BANK);
  return pool.slice(0, Math.min(count, pool.length));
}

function pointsForRank(rank) {
  return SPEED_POINTS[Math.min(rank, SPEED_POINTS.length - 1)];
}

function scoreQuestionBySpeed(question, answers, players) {
  const correctPlayers = players
    .map((player) => {
      const answer = answers[player.id];
      const optionIndex = getOptionIndex(answer);
      const answeredAt =
        answer && typeof answer === "object" ? answer.answeredAt : Infinity;
      return { playerId: player.id, optionIndex, answeredAt };
    })
    .filter(
      (entry) =>
        entry.optionIndex != null &&
        entry.optionIndex >= 0 &&
        entry.optionIndex === question.correctIndex
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
  const question = state.questions[state.currentQuestionIndex];
  if (!question) return;

  const answers = state.answersByQuestion[state.currentQuestionIndex] || {};
  const pointsByPlayer = scoreQuestionBySpeed(question, answers, room.players);

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
    totalQuestions: state.questions.length,
    maxScore: state.questions.length * SPEED_POINTS[0],
  };

  try {
    const { persistGameResults } = require("../../lib/persistGameResults");
    void persistGameResults(room);
  } catch (err) {
    console.error("[classic.finalizeGame] persist failed", err);
  }
}

function advanceQuestion(roomCode, ctx) {
  const room = ctx.rooms.get(roomCode);
  if (!room || room.phase !== "playing") return;

  const state = room.state;
  applyScoresForCurrentQuestion(room, state);

  if (state.currentQuestionIndex >= state.questions.length - 1) {
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
        answers[player.id] = { optionIndex: -1, answeredAt: deadline };
      }
    }
    current.state.answersByQuestion[questionIndex] = answers;
    advanceQuestion(roomCode, ctx);
  }, seconds * 1000);
}

function beginGame(room) {
  clearRoomTimer(room);
  const state = room.state;
  const questions = pickQuestions(room.settings.questionsPerGame);

  room.phase = "playing";
  state.questions = questions;
  state.currentQuestionIndex = 0;
  state.answersByQuestion = questions.map(() => ({}));
  state.scores = Object.fromEntries(room.players.map((p) => [p.id, 0]));
  state.result = null;
  room.phaseDeadline = null;
}

function start(room, ctx) {
  beginGame(room);
  scheduleQuestionTimer(room.code, ctx);
}

function handleAction(room, action, ctx) {
  if (action.type === "submit_answer") {
    return submitAnswer(room, action.playerId, action.optionIndex, ctx);
  }
  return { ok: false, message: "Unknown action for classic mode." };
}

function submitAnswer(room, playerId, optionIndex, ctx) {
  if (room.phase !== "playing") {
    return { ok: false, message: "Game is not in progress." };
  }

  const state = room.state;
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
  advanceQuestion,
  scheduleQuestionTimer,
};
