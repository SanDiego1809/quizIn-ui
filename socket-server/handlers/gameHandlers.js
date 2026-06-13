const { normalizeRoomCode } = require("../lib/utils");
const { getMode } = require("../modes");
const {
  getPlayerIdForSocket,
  isHostSocket,
  resetRoomToLobby,
} = require("../lib/roomLifecycle");

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

    const mode = getMode(room.mode);
    room.settings = mode.sanitizeSettings(settings ?? room.settings);
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
}

module.exports = { registerGameHandlers };
