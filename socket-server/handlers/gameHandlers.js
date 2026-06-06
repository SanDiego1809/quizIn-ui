const { normalizeRoomCode } = require("../lib/utils");
const {
  sanitizeSettings,
  startGame,
  submitAnswer,
  resetToLobby,
} = require("../lib/gameLogic");
const {
  getPlayerIdForSocket,
  isHostSocket,
} = require("../lib/roomLifecycle");

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

    room.settings = sanitizeSettings(settings);
    startGame(code, ctx);
    ctx.emitRoom(code);
  });

  socket.on("quiz:answer_submit", ({ roomCode, optionIndex }) => {
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

    const result = submitAnswer(code, playerId, optionIndex, ctx);
    if (!result.ok) {
      socket.emit("quiz:error", { message: result.message });
      return;
    }

    ctx.emitRoom(code);
  });

  socket.on("quiz:game_reset", ({ roomCode }) => {
    const code = normalizeRoomCode(roomCode);
    const room = ctx.rooms.get(code);
    if (!room) return;

    if (!isHostSocket(room, socket)) {
      socket.emit("quiz:error", { message: "Only the host can reset the room." });
      return;
    }

    resetToLobby(room);
    ctx.emitRoom(code);
  });
}

module.exports = { registerGameHandlers };
