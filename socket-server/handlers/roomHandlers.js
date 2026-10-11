const {
  uniqueRoomCode,
  randomPlayerId,
  sanitizeName,
  normalizeRoomCode,
} = require("../lib/utils");
const { DEFAULT_MODE_ID, getMode, applyRoomConfig } = require("../modes");
const { createEmptyRoom, setRoom } = require("../lib/roomStore");
const {
  bindSocketToPlayer,
  removeSocketFromAllRooms,
  isHostSocket,
  getPlayerIdForSocket,
} = require("../lib/roomLifecycle");
const { sanitizeAnimation } = require("../lib/animations");

function registerRoomHandlers(socket, ctx) {
  const { io, rooms, emitRoom } = ctx;

  socket.on("quiz:room_create", ({ name, mode = DEFAULT_MODE_ID, animation }) => {
    const safeName = sanitizeName(name);
    if (!safeName) {
      socket.emit("quiz:error", { message: "Name is required." });
      return;
    }

    removeSocketFromAllRooms(socket, ctx);

    try {
      getMode(mode);
    } catch {
      socket.emit("quiz:error", { message: "Unknown game mode." });
      return;
    }

    const roomCode = uniqueRoomCode(rooms);
    const playerId = randomPlayerId();
    const room = createEmptyRoom({
      code: roomCode,
      hostId: playerId,
      hostName: safeName,
      hostSocketId: socket.id,
      hostAnimation: sanitizeAnimation(animation),
      mode,
    });
    room.players[0].userId = socket.data?.userId || null;

    setRoom(roomCode, room);
    socket.join(roomCode);
    bindSocketToPlayer(socket, roomCode, playerId);
    emitRoom(roomCode);
  });

  socket.on("quiz:room_join", ({ roomCode, name, animation }) => {
    const code = normalizeRoomCode(roomCode);
    const safeName = sanitizeName(name);
    const room = rooms.get(code);

    if (!room) {
      socket.emit("quiz:error", { message: "Room not found." });
      return;
    }
    if (room.phase !== "lobby") {
      socket.emit("quiz:error", { message: "This game has already started." });
      return;
    }
    if (!safeName) {
      socket.emit("quiz:error", { message: "Name is required." });
      return;
    }
    if (room.players.some((p) => p.socketId === socket.id)) {
      socket.emit("quiz:error", { message: "You are already in this room." });
      return;
    }

    removeSocketFromAllRooms(socket, ctx);

    const playerId = randomPlayerId();
    room.players.push({
      id: playerId,
      name: safeName,
      animation: sanitizeAnimation(animation),
      socketId: socket.id,
      isHost: false,
      userId: socket.data?.userId || null,
    });

    socket.join(code);
    bindSocketToPlayer(socket, code, playerId);
    emitRoom(code);
  });

  socket.on("quiz:room_config", ({ roomCode, mode, settings }) => {
    const code = normalizeRoomCode(roomCode);
    const room = rooms.get(code);

    if (!room) {
      socket.emit("quiz:error", { message: "Room not found." });
      return;
    }
    if (room.phase !== "lobby") {
      socket.emit("quiz:error", {
        message: "Settings can only be changed before the game starts.",
      });
      return;
    }
    if (!isHostSocket(room, socket)) {
      socket.emit("quiz:error", {
        message: "Only the host can change room settings.",
      });
      return;
    }

    if (mode) {
      try {
        getMode(mode);
      } catch {
        socket.emit("quiz:error", { message: "Unknown game mode." });
        return;
      }
    }

    applyRoomConfig(room, { mode, settings });
    emitRoom(code);
  });

  socket.on("quiz:player_animation", ({ roomCode, animation }) => {
    const code = normalizeRoomCode(roomCode);
    const room = rooms.get(code);

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

    const player = room.players.find((entry) => entry.id === playerId);
    if (!player) return;

    player.animation = sanitizeAnimation(animation);
    emitRoom(code);
  });
}

module.exports = { registerRoomHandlers };
