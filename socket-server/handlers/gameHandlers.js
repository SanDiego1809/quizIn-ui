const { normalizeRoomCode } = require("../lib/utils");
const { getMode } = require("../modes");
const {
  getPlayerIdForSocket,
  isHostSocket,
  resetRoomToLobby,
} = require("../lib/roomLifecycle");
const { buildSeatInfo } = require("../lib/premiumSeats");
const { hostIsPremium } = require("../lib/hostLimits");
const { submitQuestionFeedback } = require("../lib/questionFeedback");

function dispatchGameAction(socket, { roomCode, action }, ctx) {
  const code = normalizeRoomCode(roomCode);
  const room = ctx.rooms.get(code);

  if (!room) {
    socket.emit("quiz:error", { message: "Room not found." });
    return;
  }

  const playerId = getPlayerIdForSocket(room, socket);
  if (!playerId) {
    socket.emit("quiz:error", {
      message: "Your session is not in this room. Rejoin with the room code.",
    });
    return;
  }

  const result = getMode(room.mode).handleAction(
    room,
    { ...action, playerId },
    ctx
  );
  if (!result.ok) {
    socket.emit("quiz:error", { message: result.message });
    return;
  }

  ctx.emitRoom(code);
}

function registerGameHandlers(socket, ctx) {
  socket.on("quiz:game_start", ({ roomCode, settings }) => {
    const code = normalizeRoomCode(roomCode);
    const room = ctx.rooms.get(code);

    if (!room) {
      socket.emit("quiz:error", {
        message:
          "Room not found on this server. Check that everyone uses the same socket URL.",
      });
      return;
    }
    if (room.phase !== "lobby") {
      socket.emit("quiz:error", { message: "The game has already started." });
      return;
    }
    if (!isHostSocket(room, socket)) {
      socket.emit("quiz:error", { message: "Only the host can start the game." });
      return;
    }
    if (room.players.length < 1) {
      socket.emit("quiz:error", { message: "Need at least one player." });
      return;
    }

    const seats = buildSeatInfo(room.players);
    if (seats.overCapacity) {
      socket.emit("quiz:error", {
        message:
          "Too many players for current Premium seats. Need another Premium player, or someone must leave.",
        code: "ROOM_SEAT_LIMIT",
      });
      return;
    }

    const mode = getMode(room.mode);
    room.settings = mode.sanitizeSettings(settings ?? room.settings, {
      premium: hostIsPremium(room),
    });

    if (typeof mode.validateStart === "function") {
      const check = mode.validateStart(room);
      if (!check?.ok) {
        socket.emit("quiz:error", {
          message: check?.message || "Cannot start this game yet.",
        });
        return;
      }
    }

    mode.start(room, ctx);
    ctx.emitRoom(code);
  });

  socket.on("quiz:game_action", (payload) => {
    dispatchGameAction(socket, payload, ctx);
  });

  socket.on("quiz:answer_submit", ({ roomCode, optionIndex }) => {
    dispatchGameAction(
      socket,
      { roomCode, action: { type: "submit_answer", optionIndex } },
      ctx
    );
  });

  socket.on("quiz:game_reset", ({ roomCode }) => {
    const code = normalizeRoomCode(roomCode);
    const room = ctx.rooms.get(code);
    if (!room) return;

    if (!isHostSocket(room, socket)) {
      socket.emit("quiz:error", { message: "Only the host can reset the room." });
      return;
    }

    resetRoomToLobby(room);
    ctx.emitRoom(code);
  });

  socket.on("quiz:question_feedback", async (payload = {}) => {
    const code = normalizeRoomCode(payload.roomCode);
    const room = ctx.rooms.get(code);
    if (!room) {
      socket.emit("quiz:question_feedback_result", {
        ok: false,
        message: "Room not found.",
      });
      return;
    }

    const playerId = getPlayerIdForSocket(room, socket);
    if (!playerId) {
      socket.emit("quiz:question_feedback_result", {
        ok: false,
        message: "Rejoin the room to rate questions.",
      });
      return;
    }

    if (room.phase !== "playing" && room.phase !== "reveal") {
      socket.emit("quiz:question_feedback_result", {
        ok: false,
        message: "You can only rate the active question.",
      });
      return;
    }

    const current = room.state?.questions?.[room.state.currentQuestionIndex];
    const questionId = String(payload.questionId || "");
    if (!current || current.id !== questionId) {
      socket.emit("quiz:question_feedback_result", {
        ok: false,
        message: "That question is not active.",
      });
      return;
    }

    try {
      const result = await submitQuestionFeedback({
        questionId,
        playerKey: playerId,
        kind: payload.kind,
        mode: room.mode || "classic",
        questionText: current.text,
        options: current.options,
        correctIndex: current.correctIndex,
        note: payload.note,
      });
      socket.emit("quiz:question_feedback_result", result);
    } catch (err) {
      console.error("[quiz:question_feedback]", err);
      socket.emit("quiz:question_feedback_result", {
        ok: false,
        message: "Could not save feedback.",
      });
    }
  });

  /** Restart immediately with current settings (final results → new match). */
  socket.on("quiz:game_rematch", ({ roomCode, settings }) => {
    const code = normalizeRoomCode(roomCode);
    const room = ctx.rooms.get(code);
    if (!room) return;

    if (!isHostSocket(room, socket)) {
      socket.emit("quiz:error", {
        message: "Only the host can start a rematch.",
      });
      return;
    }

    if (room.phase !== "final_results") {
      socket.emit("quiz:error", {
        message: "Rematch is only available after the match ends.",
      });
      return;
    }

    const seats = buildSeatInfo(room.players);
    if (seats.overCapacity) {
      socket.emit("quiz:error", {
        message:
          "Too many players for current Premium seats. Need another Premium player, or someone must leave.",
        code: "ROOM_SEAT_LIMIT",
      });
      return;
    }

    const mode = getMode(room.mode);
    room.settings = mode.sanitizeSettings(settings ?? room.settings, {
      premium: hostIsPremium(room),
    });

    if (typeof mode.validateStart === "function") {
      const check = mode.validateStart(room);
      if (!check?.ok) {
        socket.emit("quiz:error", {
          message: check?.message || "Cannot start this game yet.",
        });
        return;
      }
    }

    // Clear timers/state from the finished match, then start with same settings.
    resetRoomToLobby(room);
    mode.start(room, ctx);
    ctx.emitRoom(code);
  });
}

module.exports = { registerGameHandlers };
