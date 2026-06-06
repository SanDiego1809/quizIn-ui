const { DEFAULT_SETTINGS } = require("../config");
const QUESTION_BANK = require("../data/questions.json");
const { shuffle } = require("./utils");

function sanitizeSettings(input = {}) {
  const questionTimeSeconds = Math.min(
    300,
    Math.max(0, Number(input.questionTimeSeconds) ?? DEFAULT_SETTINGS.questionTimeSeconds)
  );
  const questionsPerGame = Math.min(
    10,
    Math.max(1, Number(input.questionsPerGame) ?? DEFAULT_SETTINGS.questionsPerGame)
  );
  return { questionTimeSeconds, questionsPerGame };
}

function clearRoomTimer(room) {
  if (room.phaseTimeoutId) {
    clearTimeout(room.phaseTimeoutId);
    room.phaseTimeoutId = null;
  }
}

function pickQuestions(count) {
  const pool = shuffle(QUESTION_BANK);
  return pool.slice(0, Math.min(count, pool.length));
}

function scoreAnswer(question, optionIndex) {
  if (optionIndex == null || optionIndex < 0) return 0;
  return optionIndex === question.correctIndex ? 1 : 0;
}

function allPlayersAnswered(room) {
  const answers = room.answersByQuestion[room.currentQuestionIndex] || {};
  return room.players.every((p) => answers[p.id] !== undefined);
}

function beginGame(room) {
  clearRoomTimer(room);
  const questions = pickQuestions(room.settings.questionsPerGame);

  room.phase = "playing";
  room.questions = questions;
  room.currentQuestionIndex = 0;
  room.answersByQuestion = questions.map(() => ({}));
  room.scores = Object.fromEntries(room.players.map((p) => [p.id, 0]));
  room.result = null;
  room.phaseDeadline = null;
}

function applyScoresForCurrentQuestion(room) {
  const question = room.questions[room.currentQuestionIndex];
  if (!question) return;

  const answers = room.answersByQuestion[room.currentQuestionIndex] || {};
  for (const player of room.players) {
    const points = scoreAnswer(question, answers[player.id]);
    room.scores[player.id] = (room.scores[player.id] || 0) + points;
  }
}

function finalizeGame(room) {
  clearRoomTimer(room);
  room.phase = "final_results";
  room.phaseDeadline = null;

  const rankings = room.players
    .map((p) => ({
      playerId: p.id,
      name: p.name,
      score: room.scores[p.id] || 0,
    }))
    .sort((a, b) => b.score - a.score);

  room.result = {
    rankings,
    totalQuestions: room.questions.length,
  };
}

function advanceQuestion(roomCode, { rooms, scheduleQuestionTimer, emitRoom }) {
  const room = rooms.get(roomCode);
  if (!room || room.phase !== "playing") return;

  applyScoresForCurrentQuestion(room);

  if (room.currentQuestionIndex >= room.questions.length - 1) {
    finalizeGame(room);
    emitRoom(roomCode);
    return;
  }

  room.currentQuestionIndex += 1;
  scheduleQuestionTimer(roomCode);
  emitRoom(roomCode);
}

function scheduleQuestionTimer(roomCode, { rooms, advanceQuestion, emitRoom }) {
  const room = rooms.get(roomCode);
  if (!room || room.phase !== "playing") return;

  clearRoomTimer(room);

  const seconds = room.settings.questionTimeSeconds;
  if (seconds <= 0) {
    room.phaseDeadline = null;
    return;
  }

  const questionIndex = room.currentQuestionIndex;
  room.phaseDeadline = Date.now() + seconds * 1000;
  room.phaseTimeoutId = setTimeout(() => {
    const current = rooms.get(roomCode);
    if (!current || current.phase !== "playing") return;
    if (current.currentQuestionIndex !== questionIndex) return;

    const answers = current.answersByQuestion[questionIndex] || {};
    for (const player of current.players) {
      if (answers[player.id] === undefined) {
        answers[player.id] = -1;
      }
    }
    current.answersByQuestion[questionIndex] = answers;
    advanceQuestion(roomCode);
  }, seconds * 1000);
}

function startGame(roomCode, ctx) {
  const room = ctx.rooms.get(roomCode);
  if (!room) return;
  beginGame(room);
  ctx.scheduleQuestionTimer(roomCode);
}

function submitAnswer(roomCode, playerId, optionIndex, ctx) {
  const room = ctx.rooms.get(roomCode);
  if (!room || room.phase !== "playing") return { ok: false, message: "Game is not in progress." };

  const question = room.questions[room.currentQuestionIndex];
  if (!question) return { ok: false, message: "No active question." };

  const idx = Number(optionIndex);
  if (!Number.isInteger(idx) || idx < 0 || idx >= question.options.length) {
    return { ok: false, message: "Pick one of the listed answers." };
  }

  const answers = room.answersByQuestion[room.currentQuestionIndex] || {};
  if (answers[playerId] !== undefined) {
    return { ok: false, message: "You already answered this question." };
  }

  answers[playerId] = idx;
  room.answersByQuestion[room.currentQuestionIndex] = answers;

  if (allPlayersAnswered(room)) {
    clearRoomTimer(room);
    room.phaseDeadline = null;
    ctx.advanceQuestion(roomCode);
  }

  return { ok: true };
}

function resetToLobby(room) {
  clearRoomTimer(room);
  room.phase = "lobby";
  room.questions = [];
  room.currentQuestionIndex = 0;
  room.answersByQuestion = [];
  room.scores = {};
  room.result = null;
  room.phaseDeadline = null;
}

module.exports = {
  sanitizeSettings,
  clearRoomTimer,
  startGame,
  submitAnswer,
  advanceQuestion,
  scheduleQuestionTimer,
  resetToLobby,
  allPlayersAnswered,
};
